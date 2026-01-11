import { NextRequest, NextResponse } from 'next/server';
import { downloadFile } from '@/lib/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import path from 'path';

// Sanitize filename to prevent path traversal
function sanitizePath(inputPath: string): string | null {
  // Remove null bytes and normalize
  const cleaned = inputPath.replace(/\0/g, '');

  // Check for path traversal attempts
  if (
    cleaned.includes('..') ||
    cleaned.includes('./') ||
    cleaned.includes('/.') ||
    cleaned.startsWith('/') ||
    cleaned.includes('\\')
  ) {
    return null;
  }

  // Normalize the path
  const normalized = path.normalize(cleaned);

  // Double check after normalization
  if (normalized.includes('..') || normalized.startsWith('/')) {
    return null;
  }

  return normalized;
}

// Validate file extension
function isAllowedExtension(filePath: string): boolean {
  const allowedExtensions = ['pdf', 'docx', 'doc'];
  const extension = filePath.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Generate request ID for logging
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawPath = params.path.join('/');

    // Sanitize and validate path
    const filePath = sanitizePath(rawPath);
    if (!filePath) {
      console.warn(`[${requestId}] Path traversal attempt by user ${session.user.id}: ${rawPath}`);
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Validate file extension
    if (!isAllowedExtension(filePath)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Security: Only allow users to access their own files
    // The path should start with the user's ID
    const pathParts = filePath.split('/');
    if (pathParts[0] !== session.user.id) {
      console.warn(`[${requestId}] Unauthorized file access attempt by user ${session.user.id}: ${filePath}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const file = await downloadFile(filePath);

    // Determine content type based on extension
    const extension = filePath.split('.').pop()?.toLowerCase();
    const contentType = extension === 'pdf'
      ? 'application/pdf'
      : extension === 'docx' || extension === 'doc'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/octet-stream';

    // Extract safe filename
    const fileName = pathParts[pathParts.length - 1];
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error(`[${requestId}] File download error:`, error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}
