import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const start = Date.now();

  try {
    // Check database connectivity with a simple query
    await prisma.$queryRaw`SELECT 1`;

    const dbLatency = Date.now() - start;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'up', latencyMs: dbLatency },
      },
    });
  } catch (error) {
    console.error('[HEALTH] Database check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'down', error: 'Connection failed' },
        },
      },
      { status: 503 }
    );
  }
}
