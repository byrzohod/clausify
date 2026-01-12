/**
 * Individual workspace member operations
 * PATCH - Update member role
 * DELETE - Remove member from workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateMemberRole, removeMember } from '@/lib/workspaces';
import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, memberId } = await params;
    const body = await request.json();
    const validatedData = updateRoleSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    await updateMemberRole(
      id,
      memberId,
      validatedData.data.role as WorkspaceRole,
      session.user.id
    );

    return NextResponse.json({ message: 'Role updated' });
  } catch (error) {
    console.error('[Workspaces] Error updating member role:', error);
    const message = error instanceof Error ? error.message : 'Failed to update role';

    if (message.includes('permissions') || message.includes('Only owner')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, memberId } = await params;

    await removeMember(id, memberId, session.user.id);

    return NextResponse.json({ message: 'Member removed' });
  } catch (error) {
    console.error('[Workspaces] Error removing member:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove member';

    if (message.includes('permissions') || message.includes('Only owner') || message.includes('Cannot remove')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
