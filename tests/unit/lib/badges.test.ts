import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    badge: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    userBadge: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    contract: {
      count: vi.fn(),
    },
    tag: {
      count: vi.fn(),
    },
    referral: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  BADGE_DEFINITIONS,
  checkAndAwardBadges,
  getUserBadges,
} from '@/lib/badges';

describe('Badges System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BADGE_DEFINITIONS', () => {
    it('should have all required badges', () => {
      expect(BADGE_DEFINITIONS.length).toBeGreaterThan(0);

      const requiredCodes = [
        'first_analysis',
        'five_analyses',
        'ten_analyses',
        'pro_member',
        'referral_champion',
      ];

      requiredCodes.forEach((code) => {
        const badge = BADGE_DEFINITIONS.find((b) => b.code === code);
        expect(badge).toBeDefined();
      });
    });

    it('should have valid badge structure', () => {
      BADGE_DEFINITIONS.forEach((badge) => {
        expect(badge.code).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.icon).toBeDefined();
        expect(badge.requirement).toBeGreaterThan(0);
        expect(badge.category).toBeDefined();
      });
    });
  });

  describe('checkAndAwardBadges', () => {
    it('should award first_analysis badge after first completed analysis', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        plan: 'FREE',
        createdAt: new Date('2026-01-01'),
        badges: [],
      } as never);
      vi.mocked(prisma.contract.count).mockResolvedValue(1);
      vi.mocked(prisma.tag.count).mockResolvedValue(0);
      vi.mocked(prisma.referral.count).mockResolvedValue(0);
      vi.mocked(prisma.badge.findUnique).mockResolvedValue({
        id: 'badge-1',
        code: 'first_analysis',
      } as never);
      vi.mocked(prisma.userBadge.create).mockResolvedValue({} as never);

      const result = await checkAndAwardBadges('user-1');

      expect(result.newBadges).toContain('first_analysis');
    });

    it('should award multiple milestone badges at once', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        plan: 'FREE',
        createdAt: new Date('2026-01-01'),
        badges: [],
      } as never);
      vi.mocked(prisma.contract.count).mockResolvedValue(10);
      vi.mocked(prisma.tag.count).mockResolvedValue(0);
      vi.mocked(prisma.referral.count).mockResolvedValue(0);
      vi.mocked(prisma.badge.findUnique).mockResolvedValue({
        id: 'badge-1',
      } as never);
      vi.mocked(prisma.userBadge.create).mockResolvedValue({} as never);

      const result = await checkAndAwardBadges('user-1');

      expect(result.newBadges).toContain('first_analysis');
      expect(result.newBadges).toContain('five_analyses');
      expect(result.newBadges).toContain('ten_analyses');
    });

    it('should not re-award already earned badges', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        plan: 'FREE',
        createdAt: new Date('2026-01-01'),
        badges: [{ badge: { code: 'first_analysis' } }],
      } as never);
      vi.mocked(prisma.contract.count).mockResolvedValue(3);
      vi.mocked(prisma.tag.count).mockResolvedValue(0);
      vi.mocked(prisma.referral.count).mockResolvedValue(0);

      const result = await checkAndAwardBadges('user-1');

      expect(result.newBadges).not.toContain('first_analysis');
    });

    it('should award pro_member badge when user upgrades', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        plan: 'PRO_MONTHLY',
        createdAt: new Date('2026-01-01'),
        badges: [],
      } as never);
      vi.mocked(prisma.contract.count).mockResolvedValue(0);
      vi.mocked(prisma.tag.count).mockResolvedValue(0);
      vi.mocked(prisma.referral.count).mockResolvedValue(0);
      vi.mocked(prisma.badge.findUnique).mockResolvedValue({
        id: 'badge-1',
      } as never);
      vi.mocked(prisma.userBadge.create).mockResolvedValue({} as never);

      const result = await checkAndAwardBadges('user-1');

      expect(result.newBadges).toContain('pro_member');
    });

    it('should award tag_organizer badge when user creates 5 tags', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        plan: 'FREE',
        createdAt: new Date('2026-01-01'),
        badges: [],
      } as never);
      vi.mocked(prisma.contract.count).mockResolvedValue(0);
      vi.mocked(prisma.tag.count).mockResolvedValue(5);
      vi.mocked(prisma.referral.count).mockResolvedValue(0);
      vi.mocked(prisma.badge.findUnique).mockResolvedValue({
        id: 'badge-1',
      } as never);
      vi.mocked(prisma.userBadge.create).mockResolvedValue({} as never);

      const result = await checkAndAwardBadges('user-1');

      expect(result.newBadges).toContain('tag_organizer');
    });

    it('should return empty array if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.contract.count).mockResolvedValue(0);
      vi.mocked(prisma.tag.count).mockResolvedValue(0);
      vi.mocked(prisma.referral.count).mockResolvedValue(0);

      const result = await checkAndAwardBadges('nonexistent');

      expect(result.newBadges).toEqual([]);
    });
  });

  describe('getUserBadges', () => {
    it('should return earned and available badges', async () => {
      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([
        {
          badge: {
            id: 'badge-1',
            code: 'first_analysis',
            name: 'First Steps',
            description: 'Complete first analysis',
            icon: '🎉',
            requirement: 1,
            category: 'MILESTONE',
          },
          earnedAt: new Date(),
        },
      ] as never);
      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        {
          id: 'badge-1',
          code: 'first_analysis',
          name: 'First Steps',
          requirement: 1,
        },
        {
          id: 'badge-2',
          code: 'five_analyses',
          name: 'Getting Serious',
          requirement: 5,
        },
      ] as never);

      const result = await getUserBadges('user-1');

      expect(result.earned).toHaveLength(1);
      expect(result.earned[0].code).toBe('first_analysis');
      expect(result.available).toHaveLength(1);
      expect(result.available[0].code).toBe('five_analyses');
    });
  });
});
