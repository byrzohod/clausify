import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCacheHeader } from '@/lib/cache';

/**
 * GET /api/dashboard
 * Returns all dashboard data in a single request:
 * - User profile and usage stats
 * - Recent contracts with analysis status
 * - Summary statistics
 *
 * This reduces multiple API calls to a single request for better performance.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Fetch all dashboard data in parallel
    const [user, contracts, stats] = await Promise.all([
      // User profile and usage
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          plan: true,
          analysesUsed: true,
          analysesLimit: true,
          subscriptionEnd: true,
          createdAt: true,
        },
      }),

      // Recent contracts with analysis
      prisma.contract.findMany({
        where: { userId: session.user.id },
        include: {
          analysis: {
            select: {
              id: true,
              status: true,
              contractType: true,
              riskScore: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),

      // Aggregated statistics
      prisma.$transaction([
        // Total contracts
        prisma.contract.count({
          where: { userId: session.user.id },
        }),
        // Completed analyses
        prisma.contract.count({
          where: {
            userId: session.user.id,
            analysis: { status: 'COMPLETED' },
          },
        }),
        // High risk count
        prisma.contract.count({
          where: {
            userId: session.user.id,
            analysis: { riskScore: 'HIGH' },
          },
        }),
        // Pending analyses
        prisma.contract.count({
          where: {
            userId: session.user.id,
            OR: [
              { status: 'UPLOADED' },
              { status: 'ANALYZING' },
              { analysis: { status: 'PROCESSING' } },
            ],
          },
        }),
      ]),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [totalContracts, completedAnalyses, highRiskCount, pendingCount] = stats;

    // Calculate subscription status
    const isSubscriptionActive =
      user.plan === 'FREE' ||
      !user.subscriptionEnd ||
      new Date(user.subscriptionEnd) >= new Date();

    const response = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        plan: user.plan,
        analysesUsed: user.analysesUsed,
        analysesLimit: user.analysesLimit,
        analysesRemaining: Math.max(0, user.analysesLimit - user.analysesUsed),
        subscriptionEnd: user.subscriptionEnd,
        isSubscriptionActive,
        memberSince: user.createdAt,
      },
      contracts: contracts.map((contract) => ({
        id: contract.id,
        fileName: contract.fileName,
        fileSize: contract.fileSize,
        mimeType: contract.mimeType,
        status: contract.status,
        createdAt: contract.createdAt,
        analysis: contract.analysis
          ? {
              id: contract.analysis.id,
              status: contract.analysis.status,
              contractType: contract.analysis.contractType,
              riskScore: contract.analysis.riskScore,
              completedAt: contract.analysis.createdAt,
            }
          : null,
      })),
      stats: {
        totalContracts,
        completedAnalyses,
        highRiskCount,
        pendingCount,
      },
      pagination: {
        limit,
        offset,
        total: totalContracts,
        hasMore: offset + contracts.length < totalContracts,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': getCacheHeader('private-short'),
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
