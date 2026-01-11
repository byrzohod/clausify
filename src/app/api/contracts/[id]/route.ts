import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/supabase/storage';
import { logContractAudit } from '@/lib/audit';
import { getCacheHeader } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id, userId: session.user.id },
      include: {
        analysis: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Use short private cache for analyzed contracts, no-cache for pending
    const cacheStrategy =
      contract.analysis?.status === 'COMPLETED'
        ? 'private-short'
        : 'private-no-cache';

    return NextResponse.json(
      { contract },
      {
        headers: {
          'Cache-Control': getCacheHeader(cacheStrategy),
        },
      }
    );
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Delete file from storage with retry logic
    const filePath = contract.fileUrl.split('/').slice(-2).join('/');
    let fileDeleted = false;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await deleteFile(filePath);
        fileDeleted = true;
        break;
      } catch (error) {
        console.warn(`[Delete] File deletion attempt ${attempt}/${maxRetries} failed:`, {
          filePath,
          contractId: id,
          userId: session.user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff: 100ms, 200ms, 400ms)
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
        }
      }
    }

    // Log for cleanup job if file deletion failed after all retries
    if (!fileDeleted) {
      console.error('[Delete] ORPHANED FILE - Failed to delete after retries:', {
        filePath,
        contractId: id,
        userId: session.user.id,
        timestamp: new Date().toISOString(),
      });
    }

    // Delete contract (cascades to analysis)
    // Include userId in WHERE to prevent TOCTOU race condition
    await prisma.contract.delete({
      where: { id, userId: session.user.id },
    });

    // Audit log successful deletion
    logContractAudit('contract.delete', {
      userId: session.user.id,
      contractId: id,
      fileName: contract.fileName,
      success: true,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    });

    return NextResponse.json({
      message: 'Contract deleted',
      fileDeleted, // Let the client know if there was an orphaned file
    });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
