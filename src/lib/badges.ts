import { prisma } from '@/lib/prisma';
import { BadgeCategory } from '@prisma/client';

// Badge definitions
export const BADGE_DEFINITIONS = [
  {
    code: 'first_analysis',
    name: 'First Steps',
    description: 'Complete your first contract analysis',
    icon: '🎉',
    requirement: 1,
    category: BadgeCategory.MILESTONE,
  },
  {
    code: 'five_analyses',
    name: 'Getting Serious',
    description: 'Complete 5 contract analyses',
    icon: '📋',
    requirement: 5,
    category: BadgeCategory.MILESTONE,
  },
  {
    code: 'ten_analyses',
    name: 'Power User',
    description: 'Complete 10 contract analyses',
    icon: '💪',
    requirement: 10,
    category: BadgeCategory.MILESTONE,
  },
  {
    code: 'twenty_five_analyses',
    name: 'Contract Expert',
    description: 'Complete 25 contract analyses',
    icon: '🏆',
    requirement: 25,
    category: BadgeCategory.MILESTONE,
  },
  {
    code: 'fifty_analyses',
    name: 'Legal Eagle',
    description: 'Complete 50 contract analyses',
    icon: '🦅',
    requirement: 50,
    category: BadgeCategory.MILESTONE,
  },
  {
    code: 'hundred_analyses',
    name: 'Contract Master',
    description: 'Complete 100 contract analyses',
    icon: '👑',
    requirement: 100,
    category: BadgeCategory.MILESTONE,
  },
  {
    code: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined Clausify in its early days',
    icon: '🌟',
    requirement: 1, // Special condition
    category: BadgeCategory.SPECIAL,
  },
  {
    code: 'referral_champion',
    name: 'Referral Champion',
    description: 'Successfully refer 3 friends',
    icon: '🤝',
    requirement: 3,
    category: BadgeCategory.ACTIVITY,
  },
  {
    code: 'pro_member',
    name: 'Pro Member',
    description: 'Upgrade to a Pro subscription',
    icon: '⭐',
    requirement: 1,
    category: BadgeCategory.SPECIAL,
  },
  {
    code: 'tag_organizer',
    name: 'Tag Organizer',
    description: 'Create 5 tags to organize contracts',
    icon: '🏷️',
    requirement: 5,
    category: BadgeCategory.ACTIVITY,
  },
] as const;

export type BadgeCode = (typeof BADGE_DEFINITIONS)[number]['code'];

/**
 * Initialize badges in the database (run once on startup or migration)
 */
export async function initializeBadges(): Promise<void> {
  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        requirement: badge.requirement,
        category: badge.category,
      },
      create: badge,
    });
  }
}

/**
 * Check and award badges for a user based on their activity
 */
export async function checkAndAwardBadges(
  userId: string
): Promise<{ newBadges: string[] }> {
  const newBadges: string[] = [];

  // Get user stats
  const [user, analysisCount, tagCount, referralCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        createdAt: true,
        badges: { select: { badge: { select: { code: true } } } },
      },
    }),
    prisma.contract.count({
      where: {
        userId,
        status: 'COMPLETED',
        analysis: { status: 'COMPLETED' },
      },
    }),
    prisma.tag.count({ where: { userId } }),
    prisma.referral.count({
      where: { referrerUserId: userId, status: 'COMPLETED' },
    }),
  ]);

  if (!user) return { newBadges };

  const earnedBadgeCodes = new Set(user.badges.map((b) => b.badge.code));

  // Check milestone badges based on analysis count
  const milestoneBadges = [
    { code: 'first_analysis', threshold: 1 },
    { code: 'five_analyses', threshold: 5 },
    { code: 'ten_analyses', threshold: 10 },
    { code: 'twenty_five_analyses', threshold: 25 },
    { code: 'fifty_analyses', threshold: 50 },
    { code: 'hundred_analyses', threshold: 100 },
  ];

  for (const { code, threshold } of milestoneBadges) {
    if (analysisCount >= threshold && !earnedBadgeCodes.has(code)) {
      await awardBadge(userId, code);
      newBadges.push(code);
    }
  }

  // Check tag organizer badge
  if (tagCount >= 5 && !earnedBadgeCodes.has('tag_organizer')) {
    await awardBadge(userId, 'tag_organizer');
    newBadges.push('tag_organizer');
  }

  // Check referral champion badge
  if (referralCount >= 3 && !earnedBadgeCodes.has('referral_champion')) {
    await awardBadge(userId, 'referral_champion');
    newBadges.push('referral_champion');
  }

  // Check pro member badge
  if (user.plan !== 'FREE' && !earnedBadgeCodes.has('pro_member')) {
    await awardBadge(userId, 'pro_member');
    newBadges.push('pro_member');
  }

  // Check early adopter badge (users who joined before a certain date)
  const earlyAdopterDeadline = new Date('2027-01-01');
  if (
    user.createdAt < earlyAdopterDeadline &&
    !earnedBadgeCodes.has('early_adopter')
  ) {
    await awardBadge(userId, 'early_adopter');
    newBadges.push('early_adopter');
  }

  return { newBadges };
}

/**
 * Award a specific badge to a user
 */
async function awardBadge(userId: string, badgeCode: string): Promise<void> {
  const badge = await prisma.badge.findUnique({
    where: { code: badgeCode },
  });

  if (!badge) {
    console.warn(`Badge not found: ${badgeCode}`);
    return;
  }

  try {
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
      },
    });
  } catch (error) {
    // Ignore duplicate errors
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return;
    }
    throw error;
  }
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(userId: string) {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: {
      badge: true,
    },
    orderBy: { earnedAt: 'desc' },
  });

  const allBadges = await prisma.badge.findMany({
    orderBy: { requirement: 'asc' },
  });

  return {
    earned: userBadges.map((ub) => ({
      ...ub.badge,
      earnedAt: ub.earnedAt,
    })),
    available: allBadges.filter(
      (b) => !userBadges.some((ub) => ub.badge.id === b.id)
    ),
  };
}
