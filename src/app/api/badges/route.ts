import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserBadges, checkAndAwardBadges } from '@/lib/badges';

// GET /api/badges - Get user's badges
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const badges = await getUserBadges(session.user.id);

    return NextResponse.json(badges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

// POST /api/badges/check - Check and award new badges
export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newBadges } = await checkAndAwardBadges(session.user.id);

    return NextResponse.json({ newBadges });
  } catch (error) {
    console.error('Error checking badges:', error);
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 }
    );
  }
}
