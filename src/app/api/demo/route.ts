import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import { parseDocument } from '@/lib/parsers';
import { analyzeContract, AIError } from '@/lib/ai';

// Rate limit: 2 demos per user (free tier limit)
const MAX_DEMO_ANALYSES = 2;
const MAX_DEMO_FILE_SIZE = 5 * 1024 * 1024; // 5MB for demo

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Authentication required. Please sign up or log in to try a demo analysis.',
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check user's demo/analysis count
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        analysesUsed: true,
        analysesLimit: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has remaining analyses
    if (user.analysesUsed >= user.analysesLimit) {
      return NextResponse.json(
        {
          error: `You've used all ${user.analysesLimit} free analyses. Upgrade to Pro for unlimited analyses.`,
          upgradeRequired: true,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_DEMO_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large for demo. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const mimeType = file.type;
    if (
      mimeType !== 'application/pdf' &&
      mimeType !==
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported types: PDF, DOCX' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse document
    const parsed = await parseDocument(buffer, mimeType);

    if (!parsed.text || parsed.text.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            'Could not extract text from document. The file may be scanned or image-based.',
        },
        { status: 400 }
      );
    }

    // Analyze with AI
    const { result } = await analyzeContract(parsed.text);

    // Increment user's analysis count atomically
    await prisma.user.update({
      where: { id: userId },
      data: {
        analysesUsed: { increment: 1 },
      },
    });

    // Save demo record for history
    await prisma.demoAnalysis.create({
      data: {
        ipAddress: userId, // Use userId instead of IP for tracking
        contractType: result.contractType,
        analysisData: JSON.parse(JSON.stringify(result)),
      },
    });

    const remainingAnalyses = user.analysesLimit - user.analysesUsed - 1;

    return NextResponse.json({
      status: 'COMPLETED',
      result,
      isDemo: true,
      remainingAnalyses,
      message:
        remainingAnalyses > 0
          ? `You have ${remainingAnalyses} free analysis${remainingAnalyses !== 1 ? 'es' : ''} remaining.`
          : 'This was your last free analysis. Upgrade to Pro for unlimited analyses.',
    });
  } catch (error) {
    console.error('Demo analysis error:', error);

    if (error instanceof AIError) {
      return NextResponse.json(
        { error: 'Analysis failed. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze contract' },
      { status: 500 }
    );
  }
}
