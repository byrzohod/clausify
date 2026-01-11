import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/stripe', () => ({
  createBillingPortalSession: vi.fn(),
}));

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createBillingPortalSession } from '@/lib/stripe';

describe('Billing Portal API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/billing/portal', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/billing/portal/route');
      const response = await POST();

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when user has no billing information', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        stripeCustomerId: null,
      } as never);

      const { POST } = await import('@/app/api/billing/portal/route');
      const response = await POST();

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('No billing information found');
    });

    it('should return 404 when user not found', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const { POST } = await import('@/app/api/billing/portal/route');
      const response = await POST();

      expect(response.status).toBe(404);
    });

    it('should return portal URL when user has billing info', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        stripeCustomerId: 'cus_123',
      } as never);
      vi.mocked(createBillingPortalSession).mockResolvedValue(
        'https://billing.stripe.com/session/123'
      );

      const { POST } = await import('@/app/api/billing/portal/route');
      const response = await POST();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe('https://billing.stripe.com/session/123');
      expect(createBillingPortalSession).toHaveBeenCalledWith(
        'cus_123',
        expect.stringContaining('/settings')
      );
    });

    it('should use NEXT_PUBLIC_APP_URL for return URL', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXT_PUBLIC_APP_URL = 'https://clausify.com';

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        stripeCustomerId: 'cus_123',
      } as never);
      vi.mocked(createBillingPortalSession).mockResolvedValue(
        'https://billing.stripe.com/session/123'
      );

      const { POST } = await import('@/app/api/billing/portal/route');
      await POST();

      expect(createBillingPortalSession).toHaveBeenCalledWith(
        'cus_123',
        'https://clausify.com/settings'
      );

      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    });

    it('should return 500 when Stripe API fails', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        stripeCustomerId: 'cus_123',
      } as never);
      vi.mocked(createBillingPortalSession).mockRejectedValue(
        new Error('Stripe API error')
      );

      const { POST } = await import('@/app/api/billing/portal/route');
      const response = await POST();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to create portal session');
    });

    it('should return 500 when database fails', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database error')
      );

      const { POST } = await import('@/app/api/billing/portal/route');
      const response = await POST();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to create portal session');
    });
  });
});
