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
      update: vi.fn(),
    },
    contract: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    analysis: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/storage', () => ({
  downloadFile: vi.fn(),
}));

vi.mock('@/lib/parsers', () => ({
  parseDocument: vi.fn(),
}));

vi.mock('@/lib/ai', () => ({
  analyzeContract: vi.fn(),
  AIError: class AIError extends Error {},
}));

import { POST, GET } from '@/app/api/analyze/[id]/route';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('/api/analyze/[id] - Optimized', () => {
  const mockSession = { user: { id: 'user-123' } };
  const mockParams = Promise.resolve({ id: 'contract-123' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST - DB Query Optimization', () => {
    it('fetches user and contract in parallel (single round-trip)', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);

      // Mock the parallel queries
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        plan: 'FREE',
        analysesUsed: 0,
        analysesLimit: 2,
        subscriptionEnd: null,
      } as never);

      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-123',
        userId: 'user-123',
        fileName: 'test.pdf',
        fileUrl: 'http://storage/user-123/file.pdf',
        mimeType: 'application/pdf',
        analysis: { status: 'COMPLETED', summary: 'Test' },
      } as never);

      const request = new NextRequest('http://localhost/api/analyze/contract-123', {
        method: 'POST',
      });

      await POST(request, { params: mockParams });

      // Verify both queries were called
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.objectContaining({
          id: true,
          plan: true,
          analysesUsed: true,
          analysesLimit: true,
          subscriptionEnd: true,
        }),
      });

      expect(prisma.contract.findUnique).toHaveBeenCalledWith({
        where: { id: 'contract-123', userId: 'user-123' },
        include: { analysis: true },
      });
    });

    it('returns 403 when user has reached analysis limit', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        plan: 'FREE',
        analysesUsed: 2,
        analysesLimit: 2,
        subscriptionEnd: null,
      } as never);

      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-123',
        userId: 'user-123',
        analysis: null,
      } as never);

      const request = new NextRequest('http://localhost/api/analyze/contract-123', {
        method: 'POST',
      });

      const response = await POST(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Analysis limit reached');
    });

    it('returns 403 when subscription has expired', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        plan: 'PRO_MONTHLY',
        analysesUsed: 0,
        analysesLimit: 100,
        subscriptionEnd: pastDate,
      } as never);

      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-123',
        userId: 'user-123',
        analysis: null,
      } as never);

      const request = new NextRequest('http://localhost/api/analyze/contract-123', {
        method: 'POST',
      });

      const response = await POST(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Analysis limit reached');
    });

    it('uses transaction for status updates', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        plan: 'FREE',
        analysesUsed: 0,
        analysesLimit: 2,
        subscriptionEnd: null,
      } as never);

      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-123',
        userId: 'user-123',
        fileName: 'test.pdf',
        fileUrl: 'http://storage/user-123/file.pdf',
        mimeType: 'application/pdf',
        analysis: null,
      } as never);

      // Mock transaction to return the analysis
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        if (typeof fn === 'function') {
          return fn({
            contract: { update: vi.fn() },
            analysis: { upsert: vi.fn().mockResolvedValue({ id: 'analysis-123' }) },
          } as never);
        }
        return fn;
      });

      const request = new NextRequest('http://localhost/api/analyze/contract-123', {
        method: 'POST',
      });

      await POST(request, { params: mockParams });

      // Verify transaction was used
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('returns cached result for already completed analysis', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        plan: 'FREE',
        analysesUsed: 0,
        analysesLimit: 2,
        subscriptionEnd: null,
      } as never);

      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-123',
        userId: 'user-123',
        analysis: {
          id: 'analysis-123',
          status: 'COMPLETED',
          summary: 'Test summary',
          contractType: 'NDA',
          riskScore: 'LOW',
          keyTerms: [],
          obligations: [],
          redFlags: [],
          sections: [],
          parties: [],
          dates: [],
          amounts: [],
        },
      } as never);

      const request = new NextRequest('http://localhost/api/analyze/contract-123', {
        method: 'POST',
      });

      const response = await POST(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('COMPLETED');
      expect(data.result.summary).toBe('Test summary');

      // Should not call transaction for already completed
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('GET - Cache Headers', () => {
    it('returns private-short cache for completed analyses', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);

      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-123',
        userId: 'user-123',
        analysis: {
          id: 'analysis-123',
          status: 'COMPLETED',
          summary: 'Test',
        },
      } as never);

      const request = new NextRequest('http://localhost/api/analyze/contract-123');

      const response = await GET(request, { params: mockParams });

      expect(response.headers.get('Cache-Control')).toContain('private');
      expect(response.headers.get('Cache-Control')).toContain('max-age=60');
    });

    it('returns no-cache for processing analyses', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession as never);

      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-123',
        userId: 'user-123',
        analysis: {
          id: 'analysis-123',
          status: 'PROCESSING',
        },
      } as never);

      const request = new NextRequest('http://localhost/api/analyze/contract-123');

      const response = await GET(request, { params: mockParams });

      expect(response.headers.get('Cache-Control')).toContain('no-cache');
    });
  });
});
