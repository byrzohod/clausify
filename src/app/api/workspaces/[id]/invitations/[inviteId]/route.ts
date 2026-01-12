/**
 * Individual invitation operations
 * POST - Resend invitation
 * DELETE - Cancel invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cancelInvitation, resendInvitation } from '@/lib/workspaces/invitations';
import { sendWorkspaceInviteEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteId } = await params;

    const result = await resendInvitation(inviteId, session.user.id);

    // Send invitation email
    try {
      await sendWorkspaceInviteEmail(
        result.invitation.email,
        result.invitation.workspaceName,
        result.invitation.inviterName,
        result.token,
        result.invitation.role
      );
    } catch (emailError) {
      console.error('[Workspaces] Failed to send invitation email:', emailError);
    }

    return NextResponse.json({
      message: 'Invitation resent',
      invitation: result.invitation,
    });
  } catch (error) {
    console.error('[Workspaces] Error resending invitation:', error);
    const message = error instanceof Error ? error.message : 'Failed to resend invitation';

    if (message.includes('permissions')) {
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
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteId } = await params;

    await cancelInvitation(inviteId, session.user.id);

    return NextResponse.json({ message: 'Invitation cancelled' });
  } catch (error) {
    console.error('[Workspaces] Error cancelling invitation:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel invitation';

    if (message.includes('permissions')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
