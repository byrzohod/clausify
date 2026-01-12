/**
 * API Keys management endpoint
 * GET - List user's API keys
 * POST - Create a new API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createApiKey, listApiKeys } from '@/lib/api-keys';
import { z } from 'zod';

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  rateLimit: z.number().int().min(10).max(1000).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await listApiKeys(session.user.id);

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('[API Keys] Error listing keys:', error);
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createKeySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { name, expiresInDays, rateLimit } = validatedData.data;

    let expiresAt: Date | undefined;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const result = await createApiKey({
      userId: session.user.id,
      name,
      expiresAt,
      rateLimit,
    });

    return NextResponse.json(
      {
        apiKey: result.apiKey,
        secretKey: result.secretKey,
        message: 'Store this key securely - it will not be shown again',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Keys] Error creating key:', error);
    const message = error instanceof Error ? error.message : 'Failed to create API key';

    if (message.includes('limit reached')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
