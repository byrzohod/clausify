/**
 * Workspace members management
 * GET - List workspace members
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getWorkspaceMembers, getUserWorkspaceRole } from '@/lib/workspaces';

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

    // Check if user is a member
    const role = await getUserWorkspaceRole(session.user.id, id);
    if (!role) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const members = await getWorkspaceMembers(id);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('[Workspaces] Error listing members:', error);
    return NextResponse.json({ error: 'Failed to list members' }, { status: 500 });
  }
}
