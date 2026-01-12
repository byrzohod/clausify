import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSlackSchema = z.object({
  channelId: z.string().optional(),
  channelName: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  notifyOnAnalysis: z.boolean().optional(),
});

// GET /api/integrations/slack - Get user's Slack integration status
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await prisma.slackIntegration.findUnique({
      where: { userId: session.user.id },
    });

    if (!integration) {
      return NextResponse.json({
        connected: false,
        integration: null,
      });
    }

    return NextResponse.json({
      connected: true,
      integration: {
        teamId: integration.teamId,
        teamName: integration.teamName,
        channelId: integration.channelId,
        channelName: integration.channelName,
        notifyOnAnalysis: integration.notifyOnAnalysis,
        createdAt: integration.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching Slack integration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/slack/callback - Handle Slack OAuth callback
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, redirectUri } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID || '',
        client_secret: process.env.SLACK_CLIENT_SECRET || '',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('Slack OAuth error:', tokenData.error);
      return NextResponse.json(
        { error: 'Failed to connect to Slack' },
        { status: 400 }
      );
    }

    // Store integration
    const integration = await prisma.slackIntegration.upsert({
      where: { userId: session.user.id },
      update: {
        teamId: tokenData.team.id,
        teamName: tokenData.team.name,
        accessToken: tokenData.access_token,
        webhookUrl: tokenData.incoming_webhook?.url,
        channelId: tokenData.incoming_webhook?.channel_id,
        channelName: tokenData.incoming_webhook?.channel,
      },
      create: {
        userId: session.user.id,
        teamId: tokenData.team.id,
        teamName: tokenData.team.name,
        accessToken: tokenData.access_token,
        webhookUrl: tokenData.incoming_webhook?.url,
        channelId: tokenData.incoming_webhook?.channel_id,
        channelName: tokenData.incoming_webhook?.channel,
      },
    });

    return NextResponse.json({
      success: true,
      integration: {
        teamName: integration.teamName,
        channelName: integration.channelName,
      },
    });
  } catch (error) {
    console.error('Error connecting Slack:', error);
    return NextResponse.json(
      { error: 'Failed to connect Slack' },
      { status: 500 }
    );
  }
}

// PATCH /api/integrations/slack - Update Slack settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSlackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const integration = await prisma.slackIntegration.update({
      where: { userId: session.user.id },
      data: validation.data,
    });

    return NextResponse.json({
      integration: {
        channelId: integration.channelId,
        channelName: integration.channelName,
        notifyOnAnalysis: integration.notifyOnAnalysis,
      },
    });
  } catch (error) {
    console.error('Error updating Slack integration:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/slack - Disconnect Slack
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.slackIntegration.delete({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Slack:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}

// Note: notifySlackAnalysisComplete has been moved to @/lib/integrations/slack
