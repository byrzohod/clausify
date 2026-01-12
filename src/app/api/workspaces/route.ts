/**
 * Workspaces management endpoint
 * GET - List user's workspaces
 * POST - Create a new workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createWorkspace, listUserWorkspaces } from '@/lib/workspaces';
import { z } from 'zod';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await listUserWorkspaces(session.user.id);

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('[Workspaces] Error listing workspaces:', error);
    return NextResponse.json({ error: 'Failed to list workspaces' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createWorkspaceSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const workspace = await createWorkspace({
      name: validatedData.data.name,
      ownerId: session.user.id,
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('[Workspaces] Error creating workspace:', error);
    const message = error instanceof Error ? error.message : 'Failed to create workspace';

    if (message.includes('limit reached')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
