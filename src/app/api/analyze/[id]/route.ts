import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { downloadFile } from '@/lib/storage';
import { parseDocument } from '@/lib/parsers';
import { analyzeContract, AIError } from '@/lib/ai';
import { getCacheHeader } from '@/lib/cache';
import {
  generateContentHash,
  getCachedAnalysis,
  storeContentHash,
} from '@/lib/ai/analysis-cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: contractId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Single query to get user and contract together (reduces 2 queries to 1)
    const [user, contract] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          plan: true,
          analysesUsed: true,
          analysesLimit: true,
          subscriptionEnd: true,
        },
      }),
      prisma.contract.findUnique({
        where: { id: contractId, userId: session.user.id },
        include: { analysis: true },
      }),
    ]);

    // Check user limits
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check subscription validity and limits
    const subscriptionValid = user.plan === 'FREE' ||
      !user.subscriptionEnd ||
      new Date(user.subscriptionEnd) >= new Date();

    if (!subscriptionValid || user.analysesUsed >= user.analysesLimit) {
      return NextResponse.json(
        {
          error: 'Analysis limit reached. Please upgrade your plan to continue.',
        },
        { status: 403 }
      );
    }

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if already analyzed
    if (contract.analysis?.status === 'COMPLETED') {
      return NextResponse.json({
        analysisId: contract.analysis.id,
        status: 'COMPLETED',
        result: {
          summary: contract.analysis.summary,
          contractType: contract.analysis.contractType,
          riskScore: contract.analysis.riskScore,
          keyTerms: contract.analysis.keyTerms,
          obligations: contract.analysis.obligations,
          redFlags: contract.analysis.redFlags,
          sections: contract.analysis.sections,
          parties: contract.analysis.parties,
          dates: contract.analysis.dates,
          amounts: contract.analysis.amounts,
        },
      });
    }

    // Use transaction to update contract status and create/update analysis atomically
    const analysis = await prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'ANALYZING' },
      });

      return tx.analysis.upsert({
        where: { contractId },
        create: {
          contractId,
          status: 'PROCESSING',
        },
        update: {
          status: 'PROCESSING',
          error: null,
        },
      });
    });

    try {
      // Download file
      const filePath = contract.fileUrl.split('/').pop()!;
      const fullPath = `${session.user.id}/${filePath}`;
      const fileBuffer = await downloadFile(fullPath);

      // Parse document
      const parsed = await parseDocument(fileBuffer, contract.mimeType);

      if (!parsed.text || parsed.text.trim().length === 0) {
        throw new Error(
          'Could not extract text from document. The file may be scanned or image-based.'
        );
      }

      // Generate content hash for cache lookup
      const contentHash = generateContentHash(parsed.text);

      // Check cache for identical content analysis
      const cachedResult = await getCachedAnalysis(contentHash);
      if (cachedResult) {
        console.log('[Analyze] Cache hit for content hash:', contentHash.substring(0, 16));

        // Use cached result - save to this analysis and complete
        await prisma.$transaction(async (tx) => {
          await tx.analysis.update({
            where: { id: analysis.id },
            data: {
              status: 'COMPLETED',
              summary: cachedResult.summary,
              contractType: cachedResult.contractType,
              riskScore: cachedResult.riskScore,
              keyTerms: JSON.parse(JSON.stringify(cachedResult.keyTerms)),
              obligations: JSON.parse(JSON.stringify(cachedResult.obligations)),
              redFlags: JSON.parse(JSON.stringify(cachedResult.redFlags)),
              sections: JSON.parse(JSON.stringify(cachedResult.sections)),
              parties: JSON.parse(JSON.stringify(cachedResult.parties)),
              dates: JSON.parse(JSON.stringify(cachedResult.dates)),
              amounts: JSON.parse(JSON.stringify(cachedResult.amounts)),
              contentHash,
              processingTime: 0, // Cached, no processing time
            },
          });

          await tx.contract.update({
            where: { id: contractId },
            data: { status: 'COMPLETED' },
          });

          // Increment user's analysis count (cache still counts)
          await tx.user.update({
            where: { id: session.user.id },
            data: { analysesUsed: { increment: 1 } },
          });
        });

        return NextResponse.json({
          analysisId: analysis.id,
          status: 'COMPLETED',
          cached: true,
          result: cachedResult,
        });
      }

      // No cache hit - analyze with AI
      console.log('[Analyze] Cache miss, calling AI for content hash:', contentHash.substring(0, 16));
      const { result, tokenCount, processingTime } =
        await analyzeContract(parsed.text);

      // Use transaction to save results, update contract, and increment count atomically
      await prisma.$transaction(async (tx) => {
        // Save analysis results with content hash for future cache hits
        await tx.analysis.update({
          where: { id: analysis.id },
          data: {
            status: 'COMPLETED',
            summary: result.summary,
            contractType: result.contractType,
            riskScore: result.riskScore,
            keyTerms: JSON.parse(JSON.stringify(result.keyTerms)),
            obligations: JSON.parse(JSON.stringify(result.obligations)),
            redFlags: JSON.parse(JSON.stringify(result.redFlags)),
            sections: JSON.parse(JSON.stringify(result.sections)),
            parties: JSON.parse(JSON.stringify(result.parties)),
            dates: JSON.parse(JSON.stringify(result.dates)),
            amounts: JSON.parse(JSON.stringify(result.amounts)),
            contentHash, // Store for cache
            tokenCount,
            processingTime,
          },
        });

        // Update contract status
        await tx.contract.update({
          where: { id: contractId },
          data: { status: 'COMPLETED' },
        });

        // Increment user's analysis count
        await tx.user.update({
          where: { id: session.user.id },
          data: { analysesUsed: { increment: 1 } },
        });
      });

      return NextResponse.json({
        analysisId: analysis.id,
        status: 'COMPLETED',
        result,
      });
    } catch (error) {
      const errorMessage =
        error instanceof AIError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error occurred';

      // Mark as failed (use transaction for atomicity)
      await prisma.$transaction(async (tx) => {
        await tx.analysis.update({
          where: { id: analysis.id },
          data: {
            status: 'FAILED',
            error: errorMessage,
          },
        });

        await tx.contract.update({
          where: { id: contractId },
          data: { status: 'FAILED' },
        });
      });

      return NextResponse.json(
        { error: `Analysis failed: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze contract' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: contractId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId, userId: session.user.id },
      include: { analysis: true },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (!contract.analysis) {
      return NextResponse.json({
        status: 'PENDING',
        message: 'Analysis not started',
      });
    }

    // Cache completed analyses, but not pending/processing
    const cacheStrategy =
      contract.analysis.status === 'COMPLETED'
        ? 'private-short'
        : 'private-no-cache';

    return NextResponse.json(
      {
        analysisId: contract.analysis.id,
        status: contract.analysis.status,
        error: contract.analysis.error,
        result:
          contract.analysis.status === 'COMPLETED'
            ? {
                summary: contract.analysis.summary,
                contractType: contract.analysis.contractType,
                riskScore: contract.analysis.riskScore,
                keyTerms: contract.analysis.keyTerms,
                obligations: contract.analysis.obligations,
                redFlags: contract.analysis.redFlags,
                sections: contract.analysis.sections,
                parties: contract.analysis.parties,
                dates: contract.analysis.dates,
                amounts: contract.analysis.amounts,
              }
            : undefined,
      },
      {
        headers: {
          'Cache-Control': getCacheHeader(cacheStrategy),
        },
      }
    );
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis status' },
      { status: 500 }
    );
  }
}
