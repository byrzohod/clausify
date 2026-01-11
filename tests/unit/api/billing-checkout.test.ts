import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  createCheckoutSession: vi.fn(),
  PLANS: {
    FREE: { analyses: 2, price: 0 },
    BASIC: { analyses: 20, price: 9.99 },
    PRO: { analyses: 100, price: 29.99 },
    ENTERPRISE: { analyses: -1, price: 99.99 },
  },
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

describe('Billing Checkout API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/billing/checkout', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/billing/checkout/route');
      const request = new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'PRO' }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);
      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid plan', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { POST } = await import('@/app/api/billing/checkout/route');
      const request = new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'INVALID_PLAN' }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid plan selected');
    });

    it('should return 400 when plan is missing', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { POST } = await import('@/app/api/billing/checkout/route');
      const request = new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);
      expect(response.status).toBe(400);
    });

    it('should return 404 when user not found in database', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const { POST } = await import('@/app/api/billing/checkout/route');
      const request = new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PRO' }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);
      expect(response.status).toBe(404);
    });

    it('should create checkout session and return URL', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      } as never);
      vi.mocked(createCheckoutSession).mockResolvedValue(
        'https://checkout.stripe.com/session_123'
      );

      const { POST } = await import('@/app/api/billing/checkout/route');
      const request = new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PRO' }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.url).toBe('https://checkout.stripe.com/session_123');

      expect(createCheckoutSession).toHaveBeenCalledWith(
        'user-1',
        'test@example.com',
        'PRO',
        expect.stringContaining('/dashboard?payment=success'),
        expect.stringContaining('/pricing?payment=cancelled')
      );
    });

    it('should accept BASIC plan', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      } as never);
      vi.mocked(createCheckoutSession).mockResolvedValue('https://checkout.stripe.com/basic');

      const { POST } = await import('@/app/api/billing/checkout/route');
      const request = new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'BASIC' }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);

      expect(createCheckoutSession).toHaveBeenCalledWith(
        'user-1',
        'test@example.com',
        'BASIC',
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle checkout session creation error', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      } as never);
      vi.mocked(createCheckoutSession).mockRejectedValue(new Error('Stripe error'));

      const { POST } = await import('@/app/api/billing/checkout/route');
      const request = new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PRO' }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to create checkout session');
    });
  });
});
