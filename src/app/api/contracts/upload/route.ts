import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage';
import { isSupportedType, validateFileMagicBytes, detectFileType } from '@/lib/parsers';
import { logContractAudit } from '@/lib/audit';
import { getCacheHeader } from '@/lib/cache';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate declared MIME type
    const mimeType = file.type;
    if (!isSupportedType(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported types: PDF, DOCX' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file content matches declared MIME type (prevent MIME spoofing)
    if (!validateFileMagicBytes(buffer, mimeType)) {
      const detectedType = detectFileType(buffer);
      console.warn('[Upload] MIME type mismatch', {
        declared: mimeType,
        detected: detectedType,
        fileName: file.name,
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: 'File content does not match file type. Please upload a valid PDF or DOCX file.' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const { path, url } = await uploadFile(
      buffer,
      file.name,
      session.user.id
    );

    // Create contract record in database
    const contract = await prisma.contract.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileUrl: url,
        fileSize: file.size,
        mimeType: mimeType,
        status: 'UPLOADED',
      },
    });

    // Audit log successful upload
    logContractAudit('contract.upload', {
      userId: session.user.id,
      contractId: contract.id,
      fileName: file.name,
      success: true,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    });

    return NextResponse.json(
      {
        contractId: contract.id,
        fileName: contract.fileName,
        status: contract.status,
        fileUrl: url,
      },
      {
        status: 201,
        headers: {
          'Cache-Control': getCacheHeader('no-store'),
        },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
