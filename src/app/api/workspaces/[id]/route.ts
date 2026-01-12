/**
 * Individual workspace operations
 * GET - Get workspace details
 * PATCH - Update workspace
 * DELETE - Delete workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getWorkspace,
  getUserWorkspaceRole,
  updateWorkspace,
  deleteWorkspace,
} from '@/lib/workspaces';
import { z } from 'zod';

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

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

    const workspace = await getWorkspace(id);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ workspace, role });
  } catch (error) {
    console.error('[Workspaces] Error getting workspace:', error);
    return NextResponse.json({ error: 'Failed to get workspace' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateWorkspaceSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const workspace = await updateWorkspace(id, session.user.id, validatedData.data);

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('[Workspaces] Error updating workspace:', error);
    const message = error instanceof Error ? error.message : 'Failed to update workspace';

    if (message.includes('permissions')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
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

    await deleteWorkspace(id, session.user.id);

    return NextResponse.json({ message: 'Workspace deleted' });
  } catch (error) {
    console.error('[Workspaces] Error deleting workspace:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete workspace';

    if (message.includes('Only owner')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
