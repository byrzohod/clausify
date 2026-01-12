/**
 * Tests for email notification service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailPreferences: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Email Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('RESEND_API_KEY', 'test_api_key');
    vi.stubEnv('EMAIL_FROM', 'Test <test@test.com>');
  });

  describe('sendEmail', () => {
    it('sends email successfully', async () => {
      const { sendEmail } = await import('@/lib/email/client');

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'email-123' }),
      });

      const result = await sendEmail({
        to: 'user@test.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('email-123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_api_key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('handles API errors', async () => {
      const { sendEmail } = await import('@/lib/email/client');

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid recipient' }),
      });

      await expect(
        sendEmail({ to: 'invalid', subject: 'Test', html: '<p>Hi</p>' })
      ).rejects.toThrow('Invalid recipient');
    });

    it('skips sending when API key not configured', async () => {
      vi.stubEnv('RESEND_API_KEY', '');

      // Re-import to pick up new env
      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/client');

      const result = await sendEmail({
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      });

      expect(result.success).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Email Templates', () => {
    it('generates welcome email', async () => {
      const { generateWelcomeEmail } = await import('@/lib/email/client');

      const { subject, html } = generateWelcomeEmail('John');

      expect(subject).toBe('Welcome to Clausify!');
      expect(html).toContain('John');
      expect(html).toContain('Welcome to Clausify');
      expect(html).toContain('Upload Your First Contract');
    });

    it('generates analysis complete email', async () => {
      const { generateAnalysisCompleteEmail } = await import('@/lib/email/client');

      const { subject, html } = generateAnalysisCompleteEmail(
        'contract.pdf',
        'HIGH',
        3,
        'https://clausify.app/contracts/123'
      );

      expect(subject).toBe('Analysis Complete: contract.pdf');
      expect(html).toContain('contract.pdf');
      expect(html).toContain('HIGH');
      expect(html).toContain('3'); // red flags count
      expect(html).toContain('https://clausify.app/contracts/123');
    });

    it('generates expiration alert email', async () => {
      const { generateExpirationAlertEmail } = await import('@/lib/email/client');

      const { subject, html } = generateExpirationAlertEmail(
        'Employment Agreement',
        '2024-12-31',
        7,
        'https://clausify.app/contracts/456'
      );

      expect(subject).toContain('Contract expiring');
      expect(subject).toContain('7 days');
      expect(html).toContain('Employment Agreement');
      expect(html).toContain('2024-12-31');
    });

    it('marks urgent expiration alerts', async () => {
      const { generateExpirationAlertEmail } = await import('@/lib/email/client');

      const { subject, html } = generateExpirationAlertEmail(
        'NDA',
        '2024-01-05',
        3,
        'https://clausify.app/contracts/789'
      );

      expect(subject).toContain('Urgent');
      expect(html).toContain('less than a week');
    });

    it('generates password reset email', async () => {
      const { generatePasswordResetEmail } = await import('@/lib/email/client');

      const resetUrl = 'https://clausify.app/auth/reset-password?token=abc123';
      const { subject, html } = generatePasswordResetEmail(resetUrl);

      expect(subject).toBe('Reset your Clausify password');
      expect(html).toContain(resetUrl);
      expect(html).toContain('1 hour');
    });

    it('generates workspace invite email', async () => {
      const { generateWorkspaceInviteEmail } = await import('@/lib/email/client');

      const { subject, html } = generateWorkspaceInviteEmail(
        'Acme Corp',
        'John Doe',
        'https://clausify.app/invite/token123',
        'ADMIN'
      );

      expect(subject).toContain('Acme Corp');
      expect(html).toContain('John Doe');
      expect(html).toContain('Acme Corp');
      expect(html).toContain('ADMIN');
      expect(html).toContain('7 days');
    });
  });
});

describe('Email Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('RESEND_API_KEY', 'test_api_key');
  });

  describe('shouldSendEmail checks', () => {
    it('respects user preferences', async () => {
      // Reset modules to ensure fresh state
      vi.resetModules();

      const { prisma } = await import('@/lib/prisma');

      (prisma.emailPreferences.findUnique as any).mockResolvedValue({
        userId: 'user-1',
        analysisComplete: false,
        expirationAlerts: true,
        marketingEmails: false,
        weeklyDigest: false,
      });

      const { sendAnalysisCompleteEmail } = await import('@/lib/email');

      // Mock fetch to avoid actual API call
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'email-1' }),
      });

      // This should NOT send because analysisComplete is false
      await sendAnalysisCompleteEmail(
        'user-1',
        'user@test.com',
        'contract.pdf',
        'LOW',
        0,
        'contract-1'
      );

      // fetch should not be called because preference is disabled
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('defaults to true for transactional emails when no preferences', async () => {
      vi.resetModules();

      const { prisma } = await import('@/lib/prisma');

      (prisma.emailPreferences.findUnique as any).mockResolvedValue(null);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'email-1' }),
      });

      const { sendAnalysisCompleteEmail } = await import('@/lib/email');

      await sendAnalysisCompleteEmail(
        'user-1',
        'user@test.com',
        'contract.pdf',
        'LOW',
        0,
        'contract-1'
      );

      // Should send because default for analysisComplete is true
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
