/**
 * Workspace invitations management
 * GET - List pending invitations
 * POST - Create a new invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserWorkspaceRole } from '@/lib/workspaces';
import { createInvitation, listWorkspaceInvitations } from '@/lib/workspaces/invitations';
import { sendWorkspaceInviteEmail } from '@/lib/email';
import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
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

    // Check if user has permission to view invitations
    const role = await getUserWorkspaceRole(session.user.id, id);
    if (!role || !['OWNER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const invitations = await listWorkspaceInvitations(id);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('[Workspaces] Error listing invitations:', error);
    return NextResponse.json({ error: 'Failed to list invitations' }, { status: 500 });
  }
}

export async function POST(
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
    const validatedData = createInvitationSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { email, role } = validatedData.data;

    const result = await createInvitation(
      id,
      email,
      role as WorkspaceRole,
      session.user.id
    );

    // Send invitation email
    try {
      await sendWorkspaceInviteEmail(
        email,
        result.invitation.workspaceName,
        result.invitation.inviterName,
        result.token,
        role
      );
    } catch (emailError) {
      console.error('[Workspaces] Failed to send invitation email:', emailError);
      // Continue even if email fails - invitation is still created
    }

    return NextResponse.json({ invitation: result.invitation }, { status: 201 });
  } catch (error) {
    console.error('[Workspaces] Error creating invitation:', error);
    const message = error instanceof Error ? error.message : 'Failed to create invitation';

    if (message.includes('permissions') || message.includes('Only owner')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (message.includes('already') || message.includes('pending')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (message.includes('limit reached')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
