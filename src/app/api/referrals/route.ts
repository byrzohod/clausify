import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const REFERRAL_BONUS_ANALYSES = 2; // Bonus analyses for both referrer and referred

// GET /api/referrals - Get user's referral info
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        referralCode: true,
        referralsMade: {
          select: {
            id: true,
            status: true,
            bonusApplied: true,
            createdAt: true,
            completedAt: true,
            referred: {
              select: {
                email: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        referredBy: {
          select: {
            referralCode: true,
            referrer: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const completedReferrals = user.referralsMade.filter(
      (r) => r.status === 'COMPLETED'
    ).length;
    const pendingReferrals = user.referralsMade.filter(
      (r) => r.status === 'PENDING'
    ).length;

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink: `${process.env.NEXTAUTH_URL}/signup?ref=${user.referralCode}`,
      stats: {
        total: user.referralsMade.length,
        completed: completedReferrals,
        pending: pendingReferrals,
        bonusEarned: completedReferrals * REFERRAL_BONUS_ANALYSES,
      },
      referrals: user.referralsMade.map((r) => ({
        id: r.id,
        email: r.referred.email.replace(/(.{2}).*@/, '$1***@'), // Mask email
        status: r.status,
        bonusApplied: r.bonusApplied,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
      })),
      referredBy: user.referredBy
        ? {
            referrerEmail: user.referredBy.referrer.email.replace(
              /(.{2}).*@/,
              '$1***@'
            ),
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching referral info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral info' },
      { status: 500 }
    );
  }
}

// POST /api/referrals/apply - Apply a referral code (called during signup)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code required' },
        { status: 400 }
      );
    }

    // Check if user already has a referrer
    const existingReferral = await prisma.referral.findUnique({
      where: { referredUserId: session.user.id },
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Referral already applied' },
        { status: 400 }
      );
    }

    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    if (referrer.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    // Create referral record
    await prisma.referral.create({
      data: {
        referrerUserId: referrer.id,
        referredUserId: session.user.id,
        referralCode,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Referral code applied. Complete your first analysis to activate the bonus!',
    });
  } catch (error) {
    console.error('Error applying referral:', error);
    return NextResponse.json(
      { error: 'Failed to apply referral' },
      { status: 500 }
    );
  }
}

// Note: completeReferral has been moved to @/lib/referrals
