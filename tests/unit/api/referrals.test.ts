import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    referral: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

describe('Referrals API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/referrals', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/referrals/route');
      const response = await GET();

      expect(response.status).toBe(401);
    });

    it('should return referral info for user', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        referralCode: 'REF123',
        referralsMade: [
          {
            id: 'ref-1',
            status: 'COMPLETED',
            bonusApplied: true,
            createdAt: new Date(),
            completedAt: new Date(),
            referred: { email: 'friend@example.com', createdAt: new Date() },
          },
          {
            id: 'ref-2',
            status: 'PENDING',
            bonusApplied: false,
            createdAt: new Date(),
            completedAt: null,
            referred: { email: 'pending@example.com', createdAt: new Date() },
          },
        ],
        referredBy: null,
      } as never);

      const { GET } = await import('@/app/api/referrals/route');
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.referralCode).toBe('REF123');
      expect(data.stats.total).toBe(2);
      expect(data.stats.completed).toBe(1);
      expect(data.stats.pending).toBe(1);
      expect(data.referrals).toHaveLength(2);
    });

    it('should mask referred email addresses', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        referralCode: 'REF123',
        referralsMade: [
          {
            id: 'ref-1',
            status: 'COMPLETED',
            bonusApplied: true,
            createdAt: new Date(),
            completedAt: new Date(),
            referred: { email: 'friend@example.com', createdAt: new Date() },
          },
        ],
        referredBy: null,
      } as never);

      const { GET } = await import('@/app/api/referrals/route');
      const response = await GET();

      const data = await response.json();
      expect(data.referrals[0].email).not.toContain('friend@example.com');
      expect(data.referrals[0].email).toContain('***');
    });
  });

  describe('POST /api/referrals', () => {
    it('should apply a referral code', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.referral.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'referrer-1',
        referralCode: 'REF123',
      } as never);
      vi.mocked(prisma.referral.create).mockResolvedValue({} as never);

      const { POST } = await import('@/app/api/referrals/route');
      const request = new Request('http://localhost/api/referrals', {
        method: 'POST',
        body: JSON.stringify({ referralCode: 'REF123' }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should reject if already referred', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.referral.findUnique).mockResolvedValue({
        id: 'existing-referral',
      } as never);

      const { POST } = await import('@/app/api/referrals/route');
      const request = new Request('http://localhost/api/referrals', {
        method: 'POST',
        body: JSON.stringify({ referralCode: 'REF123' }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('already applied');
    });

    it('should reject invalid referral code', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.referral.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const { POST } = await import('@/app/api/referrals/route');
      const request = new Request('http://localhost/api/referrals', {
        method: 'POST',
        body: JSON.stringify({ referralCode: 'INVALID' }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(404);
    });

    it('should prevent self-referral', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.referral.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1', // Same as logged in user
        referralCode: 'REF123',
      } as never);

      const { POST } = await import('@/app/api/referrals/route');
      const request = new Request('http://localhost/api/referrals', {
        method: 'POST',
        body: JSON.stringify({ referralCode: 'REF123' }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('yourself');
    });
  });
});
