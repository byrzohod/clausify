/**
 * Accept workspace invitation
 * POST - Accept an invitation by token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { acceptInvitation, getInvitationByToken } from '@/lib/workspaces/invitations';
import { z } from 'zod';

const acceptSchema = z.object({
  token: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or expired' }, { status: 404 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('[Invitations] Error getting invitation:', error);
    return NextResponse.json({ error: 'Failed to get invitation' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = acceptSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const result = await acceptInvitation(validatedData.data.token, session.user.id);

    return NextResponse.json({
      message: 'Invitation accepted',
      workspaceId: result.workspaceId,
      role: result.role,
    });
  } catch (error) {
    console.error('[Invitations] Error accepting invitation:', error);
    const message = error instanceof Error ? error.message : 'Failed to accept invitation';

    if (message.includes('not found') || message.includes('expired')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message.includes('does not match') || message.includes('Already a member')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes('limit reached')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
