/**
 * Referral utilities
 */

import { prisma } from '@/lib/prisma';

const REFERRAL_BONUS_ANALYSES = 2; // Bonus analyses for both referrer and referred

/**
 * Complete a referral and award bonuses (called after first analysis)
 */
export async function completeReferral(userId: string): Promise<void> {
  const referral = await prisma.referral.findUnique({
    where: { referredUserId: userId },
  });

  if (!referral || referral.status !== 'PENDING') {
    return;
  }

  // Complete the referral and award bonuses
  await prisma.$transaction(async (tx) => {
    // Update referral status
    await tx.referral.update({
      where: { id: referral.id },
      data: {
        status: 'COMPLETED',
        bonusApplied: true,
        completedAt: new Date(),
      },
    });

    // Award bonus to referrer
    await tx.user.update({
      where: { id: referral.referrerUserId },
      data: {
        analysesLimit: { increment: REFERRAL_BONUS_ANALYSES },
      },
    });

    // Award bonus to referred user
    await tx.user.update({
      where: { id: userId },
      data: {
        analysesLimit: { increment: REFERRAL_BONUS_ANALYSES },
      },
    });
  });

  console.log(
    `[Referral] Completed referral: ${referral.referrerUserId} -> ${userId}`
  );
}
