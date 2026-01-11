import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseDocument } from '@/lib/parsers';
import { analyzeContract, AIError } from '@/lib/ai';
import { headers } from 'next/headers';

// Rate limit: 1 demo per IP per hour
const DEMO_RATE_LIMIT_HOURS = 1;
const MAX_DEMO_FILE_SIZE = 5 * 1024 * 1024; // 5MB for demo

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'unknown';

    // Check rate limit
    const recentDemo = await prisma.demoAnalysis.findFirst({
      where: {
        ipAddress: ip,
        createdAt: {
          gte: new Date(Date.now() - DEMO_RATE_LIMIT_HOURS * 60 * 60 * 1000),
        },
      },
    });

    if (recentDemo) {
      return NextResponse.json(
        {
          error:
            'Demo limit reached. Please sign up for free to analyze more contracts.',
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

    // Save demo record for rate limiting
    await prisma.demoAnalysis.create({
      data: {
        ipAddress: ip,
        contractType: result.contractType,
        analysisData: JSON.parse(JSON.stringify(result)),
      },
    });

    return NextResponse.json({
      status: 'COMPLETED',
      result,
      isDemo: true,
      message:
        'This is a demo analysis. Sign up for free to save your analyses and get 2 free contract reviews.',
    });
  } catch (error) {
    console.error('Demo analysis error:', error);

    if (error instanceof AIError) {
      return NextResponse.json(
        { error: `Analysis failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze contract' },
      { status: 500 }
    );
  }
}
