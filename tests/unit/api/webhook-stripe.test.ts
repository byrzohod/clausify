import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
  PLANS: {
    FREE: { analyses: 2, price: 0 },
    BASIC: { analyses: 20, price: 9.99 },
    PRO: { analyses: 100, price: 29.99 },
    ENTERPRISE: { analyses: -1, price: 99.99 },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve({
    get: vi.fn((key: string) => {
      if (key === 'stripe-signature') return 'test_signature';
      return null;
    }),
  })),
}));

import { prisma } from '@/lib/prisma';
import { stripe, PLANS } from '@/lib/stripe';
import { headers } from 'next/headers';
import type Stripe from 'stripe';

describe('Stripe Webhook', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Mock STRIPE_WEBHOOK_SECRET environment variable
    process.env = { ...originalEnv, STRIPE_WEBHOOK_SECRET: 'whsec_test_secret' };
    // Default mock for successful signature verification
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => ({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      data: { object: {} },
    } as unknown as Stripe.Event));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Configuration', () => {
    it('should return 500 if STRIPE_WEBHOOK_SECRET is not configured', async () => {
      // Remove the webhook secret
      delete process.env.STRIPE_WEBHOOK_SECRET;

      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Webhook configuration error');
    });
  });

  describe('Signature Verification', () => {
    it('should reject requests without stripe-signature header', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn(() => null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      // Import route handler dynamically to use mocked dependencies
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Missing stripe-signature header');
    });

    it('should reject requests with invalid signature', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'invalid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid signature');
    });
  });

  describe('checkout.session.completed', () => {
    it('should upgrade user on successful checkout', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      const mockSession = {
        id: 'cs_test_123',
        metadata: { userId: 'user-1', plan: 'PRO' },
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: { object: mockSession },
      } as unknown as Stripe.Event);

      vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      } as Stripe.Subscription);

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        plan: 'PRO',
      } as Parameters<typeof prisma.user.update>[0]['data'] & { id: string; email: string });

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          plan: 'PRO',
          stripeCustomerId: 'cus_test_123',
          subscriptionId: 'sub_test_123',
          analysesLimit: PLANS.PRO.analyses,
          analysesUsed: 0,
        }),
      });
    });

    it('should handle checkout with missing metadata', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      const mockSession = {
        id: 'cs_test_123',
        metadata: {}, // Missing userId and plan
        customer: 'cus_test_123',
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: { object: mockSession },
      } as unknown as Stripe.Event);

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      // Should return 200 (webhook received) but not update user
      expect(response.status).toBe(200);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.updated', () => {
    it('should update subscription end date', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      const newEndDate = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        current_period_end: newEndDate,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        id: 'evt_test_123',
        type: 'customer.subscription.updated',
        created: Math.floor(Date.now() / 1000),
        data: { object: mockSubscription },
      } as unknown as Stripe.Event);

      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        subscriptionId: 'sub_test_123',
        plan: 'PRO',
      } as Awaited<ReturnType<typeof prisma.user.findFirst>>);

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
      } as Parameters<typeof prisma.user.update>[0]['data'] & { id: string });

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          subscriptionEnd: new Date(newEndDate * 1000),
        },
      });
    });

    it('should handle user not found', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        id: 'evt_test_123',
        type: 'customer.subscription.updated',
        created: Math.floor(Date.now() / 1000),
        data: { object: { id: 'sub_unknown', customer: 'cus_test', status: 'active', current_period_end: 123 } },
      } as unknown as Stripe.Event);

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should downgrade user to FREE plan', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        id: 'evt_test_123',
        type: 'customer.subscription.deleted',
        created: Math.floor(Date.now() / 1000),
        data: { object: mockSubscription },
      } as unknown as Stripe.Event);

      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        subscriptionId: 'sub_test_123',
        plan: 'PRO',
      } as Awaited<ReturnType<typeof prisma.user.findFirst>>);

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
      } as Parameters<typeof prisma.user.update>[0]['data'] & { id: string });

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          plan: 'FREE',
          subscriptionId: null,
          subscriptionEnd: null,
          analysesLimit: 2,
        },
      });
    });
  });

  describe('invoice.payment_succeeded', () => {
    it('should reset analyses usage on payment success', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      const mockInvoice = {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        id: 'evt_test_123',
        type: 'invoice.payment_succeeded',
        created: Math.floor(Date.now() / 1000),
        data: { object: mockInvoice },
      } as unknown as Stripe.Event);

      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        subscriptionId: 'sub_test_123',
      } as Awaited<ReturnType<typeof prisma.user.findFirst>>);

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
      } as Parameters<typeof prisma.user.update>[0]['data'] & { id: string });

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { analysesUsed: 0 },
      });
    });

    it('should skip non-subscription invoices', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      const mockInvoice = {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: null, // No subscription
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        id: 'evt_test_123',
        type: 'invoice.payment_succeeded',
        created: Math.floor(Date.now() / 1000),
        data: { object: mockInvoice },
      } as unknown as Stripe.Event);

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('invoice.payment_failed', () => {
    it('should log payment failure', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      const mockInvoice = {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        attempt_count: 2,
        amount_due: 2999,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        id: 'evt_test_123',
        type: 'invoice.payment_failed',
        created: Math.floor(Date.now() / 1000),
        data: { object: mockInvoice },
      } as unknown as Stripe.Event);

      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        subscriptionId: 'sub_test_123',
      } as Awaited<ReturnType<typeof prisma.user.findFirst>>);

      const consoleSpy = vi.spyOn(console, 'warn');

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Webhook] invoice.payment_failed: Payment failed for user',
        expect.objectContaining({
          userId: 'user-1',
          invoiceId: 'in_test_123',
        })
      );
    });
  });

  describe('Unhandled Events', () => {
    it('should acknowledge unhandled event types', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        id: 'evt_test_123',
        type: 'customer.created',
        created: Math.floor(Date.now() / 1000),
        data: { object: {} },
      } as unknown as Stripe.Event);

      const consoleSpy = vi.spyOn(console, 'log');

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Webhook] Unhandled event type',
        expect.objectContaining({ type: 'customer.created' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(headers).mockResolvedValue({
        get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid_sig' : null),
      } as ReturnType<typeof headers> extends Promise<infer T> ? T : never);

      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        id: 'evt_test_123',
        type: 'customer.subscription.updated',
        created: Math.floor(Date.now() / 1000),
        data: { object: mockSubscription },
      } as unknown as Stripe.Event);

      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'user-1',
        subscriptionId: 'sub_test_123',
      } as Awaited<ReturnType<typeof prisma.user.findFirst>>);

      vi.mocked(prisma.user.update).mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as unknown as Parameters<typeof POST>[0]);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Webhook handler failed');
    });
  });
});
