/**
 * Individual API Key operations
 * DELETE - Revoke/delete an API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revokeApiKey, deleteApiKey, getApiUsageStats } from '@/lib/api-keys';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const stats = await getApiUsageStats(id);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[API Keys] Error getting stats:', error);
    return NextResponse.json({ error: 'Failed to get API key stats' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    let success: boolean;
    if (permanent) {
      success = await deleteApiKey(session.user.id, id);
    } else {
      success = await revokeApiKey(session.user.id, id);
    }

    if (!success) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: permanent ? 'API key deleted' : 'API key revoked',
    });
  } catch (error) {
    console.error('[API Keys] Error deleting key:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}
