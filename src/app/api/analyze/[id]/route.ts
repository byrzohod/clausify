import { NextRequest, NextResponse } from 'next/server';
import { getSession, canUserAnalyze, incrementAnalysisCount } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { downloadFile } from '@/lib/storage';
import { parseDocument } from '@/lib/parsers';
import { analyzeContract, AIError } from '@/lib/ai';

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

    // Check if user can analyze
    const canAnalyze = await canUserAnalyze(session.user.id);
    if (!canAnalyze) {
      return NextResponse.json(
        {
          error:
            'Analysis limit reached. Please upgrade your plan to continue.',
        },
        { status: 403 }
      );
    }

    // Get contract
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

    // Update contract status
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: 'ANALYZING' },
    });

    // Create or update analysis record
    const analysis = await prisma.analysis.upsert({
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

      // Analyze with AI
      const { result, tokenCount, processingTime } =
        await analyzeContract(parsed.text);

      // Save analysis results - use JSON.parse(JSON.stringify()) to ensure proper JSON format for Prisma
      await prisma.analysis.update({
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
          tokenCount,
          processingTime,
        },
      });

      // Update contract status
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'COMPLETED' },
      });

      // Increment user's analysis count
      await incrementAnalysisCount(session.user.id);

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

      // Mark as failed
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'FAILED',
          error: errorMessage,
        },
      });

      await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'FAILED' },
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis status' },
      { status: 500 }
    );
  }
}
