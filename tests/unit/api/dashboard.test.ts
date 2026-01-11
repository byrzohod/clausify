import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    contract: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/cache', () => ({
  getCacheHeader: vi.fn().mockReturnValue('private, max-age=60'),
}));

import { GET } from '@/app/api/dashboard/route';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('/api/dashboard', () => {
  const mockSession = { user: { id: 'user-123' } };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    plan: 'FREE',
    analysesUsed: 1,
    analysesLimit: 2,
    subscriptionEnd: null,
    createdAt: new Date('2025-01-01'),
  };

  const mockContracts = [
    {
      id: 'contract-1',
      fileName: 'test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      status: 'COMPLETED',
      createdAt: new Date('2025-01-10'),
      analysis: {
        id: 'analysis-1',
        status: 'COMPLETED',
        contractType: 'NDA',
        riskScore: 'LOW',
        createdAt: new Date('2025-01-10'),
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 for unauthenticated requests', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns merged dashboard data', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(prisma.contract.findMany).mockResolvedValue(mockContracts as never);
      vi.mocked(prisma.$transaction).mockResolvedValue([10, 8, 2, 1] as never);

      const request = new NextRequest('http://localhost/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.contracts).toBeDefined();
      expect(data.stats).toBeDefined();
      expect(data.pagination).toBeDefined();
    });

    it('returns user profile with correct fields', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([]);
      vi.mocked(prisma.$transaction).mockResolvedValue([0, 0, 0, 0] as never);

      const request = new NextRequest('http://localhost/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.user.id).toBe('user-123');
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.plan).toBe('FREE');
      expect(data.user.analysesRemaining).toBe(1);
      expect(data.user.isSubscriptionActive).toBe(true);
    });

    it('returns statistics', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([]);
      vi.mocked(prisma.$transaction).mockResolvedValue([10, 8, 2, 1] as never);

      const request = new NextRequest('http://localhost/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.stats.totalContracts).toBe(10);
      expect(data.stats.completedAnalyses).toBe(8);
      expect(data.stats.highRiskCount).toBe(2);
      expect(data.stats.pendingCount).toBe(1);
    });

    it('respects pagination parameters', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([]);
      vi.mocked(prisma.$transaction).mockResolvedValue([50, 40, 5, 2] as never);

      const request = new NextRequest('http://localhost/api/dashboard?limit=20&offset=10');
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(20);
      expect(data.pagination.offset).toBe(10);
      expect(data.pagination.total).toBe(50);

      expect(prisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 10,
        })
      );
    });

    it('caps limit at 50', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([]);
      vi.mocked(prisma.$transaction).mockResolvedValue([0, 0, 0, 0] as never);

      const request = new NextRequest('http://localhost/api/dashboard?limit=100');
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(50);
    });

    it('returns 404 when user not found', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([]);
      vi.mocked(prisma.$transaction).mockResolvedValue([0, 0, 0, 0] as never);

      const request = new NextRequest('http://localhost/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(404);
    });

    it('detects expired subscriptions', async () => {
      const expiredUser = {
        ...mockUser,
        plan: 'PRO_MONTHLY',
        subscriptionEnd: new Date('2024-01-01'), // In the past
      };

      vi.mocked(getSession).mockResolvedValue(mockSession as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(expiredUser as never);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([]);
      vi.mocked(prisma.$transaction).mockResolvedValue([0, 0, 0, 0] as never);

      const request = new NextRequest('http://localhost/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.user.isSubscriptionActive).toBe(false);
    });

    it('sets cache headers', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([]);
      vi.mocked(prisma.$transaction).mockResolvedValue([0, 0, 0, 0] as never);

      const request = new NextRequest('http://localhost/api/dashboard');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBeTruthy();
    });
  });
});
