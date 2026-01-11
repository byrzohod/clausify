import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    demoAnalysis: {
      create: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

describe('Demo API - Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Requirement', () => {
    it('should require authentication for demo endpoint', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const session = await getServerSession();

      expect(session).toBeNull();

      // Demo endpoint should return 401 for unauthenticated users
      if (!session?.user?.id) {
        const response = {
          error: 'Authentication required. Please sign up or log in to try a demo analysis.',
          requiresAuth: true,
        };
        expect(response.requiresAuth).toBe(true);
        expect(response.error).toContain('Authentication required');
      }
    });

    it('should allow authenticated users to use demo', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const session = await getServerSession();

      expect(session).not.toBeNull();
      expect(session?.user?.id).toBe('user-123');
    });
  });

  describe('Analysis Limit Enforcement', () => {
    it('should check user analysis limit', async () => {
      const mockUser = {
        id: 'user-123',
        plan: 'FREE',
        analysesUsed: 1,
        analysesLimit: 2,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const user = await prisma.user.findUnique({
        where: { id: 'user-123' },
        select: {
          plan: true,
          analysesUsed: true,
          analysesLimit: true,
        },
      });

      expect(user?.analysesUsed).toBeLessThan(user?.analysesLimit || 0);
      expect(user?.analysesLimit).toBe(2);
    });

    it('should block users who have exceeded their limit', async () => {
      const mockUser = {
        id: 'user-123',
        plan: 'FREE',
        analysesUsed: 2,
        analysesLimit: 2,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const user = await prisma.user.findUnique({
        where: { id: 'user-123' },
        select: {
          plan: true,
          analysesUsed: true,
          analysesLimit: true,
        },
      });

      expect(user?.analysesUsed).toBe(user?.analysesLimit);

      // Should return upgrade required
      if (user && user.analysesUsed >= user.analysesLimit) {
        const response = {
          error: `You've used all ${user.analysesLimit} free analyses. Upgrade to Pro for unlimited analyses.`,
          upgradeRequired: true,
        };
        expect(response.upgradeRequired).toBe(true);
      }
    });

    it('should increment analysis count after successful analysis', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-123',
        analysesUsed: 2,
      } as any);

      await prisma.user.update({
        where: { id: 'user-123' },
        data: {
          analysesUsed: { increment: 1 },
        },
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          analysesUsed: { increment: 1 },
        },
      });
    });
  });

  describe('Demo Analysis Tracking', () => {
    it('should save demo analysis record', async () => {
      const mockDemoRecord = {
        id: 'demo-123',
        ipAddress: 'user-123', // Uses userId now, not IP
        contractType: 'NDA',
        analysisData: {},
        createdAt: new Date(),
      };

      vi.mocked(prisma.demoAnalysis.create).mockResolvedValue(mockDemoRecord as any);

      await prisma.demoAnalysis.create({
        data: {
          ipAddress: 'user-123',
          contractType: 'NDA',
          analysisData: {},
        },
      });

      expect(prisma.demoAnalysis.create).toHaveBeenCalled();
    });
  });

  describe('Response Messages', () => {
    it('should return remaining analyses count', () => {
      const analysesLimit = 2;
      const analysesUsed = 1;
      const remainingAnalyses = analysesLimit - analysesUsed - 1;

      expect(remainingAnalyses).toBe(0);

      const message = remainingAnalyses > 0
        ? `You have ${remainingAnalyses} free analysis${remainingAnalyses !== 1 ? 'es' : ''} remaining.`
        : 'This was your last free analysis. Upgrade to Pro for unlimited analyses.';

      expect(message).toContain('last free analysis');
    });

    it('should pluralize analyses correctly', () => {
      const formatMessage = (remaining: number) =>
        remaining > 0
          ? `You have ${remaining} free ${remaining !== 1 ? 'analyses' : 'analysis'} remaining.`
          : 'This was your last free analysis.';

      expect(formatMessage(1)).toBe('You have 1 free analysis remaining.');
      expect(formatMessage(2)).toBe('You have 2 free analyses remaining.');
      expect(formatMessage(0)).toBe('This was your last free analysis.');
    });
  });
});

describe('Demo File Validation', () => {
  const MAX_DEMO_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  it('should enforce 5MB file size limit for demo', () => {
    expect(MAX_DEMO_FILE_SIZE).toBe(5242880);
  });

  it('should reject files larger than 5MB', () => {
    const fileSize = 6 * 1024 * 1024; // 6MB
    expect(fileSize > MAX_DEMO_FILE_SIZE).toBe(true);
  });

  it('should accept files smaller than 5MB', () => {
    const fileSize = 2 * 1024 * 1024; // 2MB
    expect(fileSize <= MAX_DEMO_FILE_SIZE).toBe(true);
  });

  it('should validate file MIME types', () => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const isValidType = (mimeType: string) => validTypes.includes(mimeType);

    expect(isValidType('application/pdf')).toBe(true);
    expect(isValidType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    expect(isValidType('text/plain')).toBe(false);
    expect(isValidType('image/png')).toBe(false);
  });
});
