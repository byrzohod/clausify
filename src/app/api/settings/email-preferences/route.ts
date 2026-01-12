/**
 * Email preferences management
 * GET - Get user's email preferences
 * PUT - Update email preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  analysisComplete: z.boolean().optional(),
  expirationAlerts: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await prisma.emailPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // Return defaults if no preferences exist
    if (!preferences) {
      preferences = {
        id: '',
        userId: session.user.id,
        analysisComplete: true,
        expirationAlerts: true,
        marketingEmails: false,
        weeklyDigest: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json({
      preferences: {
        analysisComplete: preferences.analysisComplete,
        expirationAlerts: preferences.expirationAlerts,
        marketingEmails: preferences.marketingEmails,
        weeklyDigest: preferences.weeklyDigest,
      },
    });
  } catch (error) {
    console.error('[Email Preferences] Error getting preferences:', error);
    return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePreferencesSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const preferences = await prisma.emailPreferences.upsert({
      where: { userId: session.user.id },
      update: validatedData.data,
      create: {
        userId: session.user.id,
        ...validatedData.data,
      },
    });

    return NextResponse.json({
      preferences: {
        analysisComplete: preferences.analysisComplete,
        expirationAlerts: preferences.expirationAlerts,
        marketingEmails: preferences.marketingEmails,
        weeklyDigest: preferences.weeklyDigest,
      },
    });
  } catch (error) {
    console.error('[Email Preferences] Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
