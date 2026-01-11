import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    contract: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    analysis: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      contract: { update: vi.fn() },
      analysis: { upsert: vi.fn().mockResolvedValue({ id: 'analysis-1' }), update: vi.fn() },
      user: { update: vi.fn() },
    })),
  },
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  downloadFile: vi.fn(),
}));

vi.mock('@/lib/parsers', () => ({
  parseDocument: vi.fn(),
}));

vi.mock('@/lib/ai', () => ({
  analyzeContract: vi.fn(),
  AIError: class AIError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AIError';
    }
  },
}));

vi.mock('@/lib/cache', () => ({
  getCacheHeader: vi.fn().mockReturnValue('no-store'),
}));

vi.mock('@/lib/ai/analysis-cache', () => ({
  generateContentHash: vi.fn().mockReturnValue('test-hash'),
  getCachedAnalysis: vi.fn().mockResolvedValue(null),
  storeContentHash: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { downloadFile } from '@/lib/storage';
import { parseDocument } from '@/lib/parsers';
import { analyzeContract } from '@/lib/ai';

describe('Analyze API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/analyze/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/analyze/[id]/route');
      const request = new Request('http://localhost/api/analyze/contract-1', {
        method: 'POST',
      });

      const response = await POST(
        request as Parameters<typeof POST>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when user has reached analysis limit', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        plan: 'FREE',
        analysesUsed: 2,
        analysesLimit: 2, // At limit
        subscriptionEnd: null,
      } as never);
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-1',
        userId: 'user-1',
        analysis: null,
      } as never);

      const { POST } = await import('@/app/api/analyze/[id]/route');
      const request = new Request('http://localhost/api/analyze/contract-1', {
        method: 'POST',
      });

      const response = await POST(
        request as Parameters<typeof POST>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Analysis limit reached');
    });

    it('should return 404 when contract not found', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        plan: 'FREE',
        analysesUsed: 0,
        analysesLimit: 2,
        subscriptionEnd: null,
      } as never);
      vi.mocked(prisma.contract.findUnique).mockResolvedValue(null);

      const { POST } = await import('@/app/api/analyze/[id]/route');
      const request = new Request('http://localhost/api/analyze/contract-1', {
        method: 'POST',
      });

      const response = await POST(
        request as Parameters<typeof POST>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Contract not found');
    });

    it('should return existing analysis if already completed', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        plan: 'FREE',
        analysesUsed: 0,
        analysesLimit: 2,
        subscriptionEnd: null,
      } as never);
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-1',
        userId: 'user-1',
        analysis: {
          id: 'analysis-1',
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

      const { POST } = await import('@/app/api/analyze/[id]/route');
      const request = new Request('http://localhost/api/analyze/contract-1', {
        method: 'POST',
      });

      const response = await POST(
        request as Parameters<typeof POST>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('COMPLETED');
      expect(data.analysisId).toBe('analysis-1');
      expect(data.result.summary).toBe('Test summary');
    });

    it('should process and return analysis for new contract', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        plan: 'FREE',
        analysesUsed: 0,
        analysesLimit: 2,
        subscriptionEnd: null,
      } as never);
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-1',
        userId: 'user-1',
        fileUrl: '/uploads/user-1/test.pdf',
        mimeType: 'application/pdf',
        analysis: null,
      } as never);
      vi.mocked(downloadFile).mockResolvedValue(Buffer.from('PDF content'));
      vi.mocked(parseDocument).mockResolvedValue({
        text: 'This is a test contract...',
        metadata: {},
      });
      vi.mocked(analyzeContract).mockResolvedValue({
        result: {
          summary: 'A test NDA',
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
        tokenCount: 500,
        processingTime: 2000,
      } as never);

      const { POST } = await import('@/app/api/analyze/[id]/route');
      const request = new Request('http://localhost/api/analyze/contract-1', {
        method: 'POST',
      });

      const response = await POST(
        request as Parameters<typeof POST>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('COMPLETED');
      expect(data.result.summary).toBe('A test NDA');

      expect(downloadFile).toHaveBeenCalled();
      expect(parseDocument).toHaveBeenCalled();
      expect(analyzeContract).toHaveBeenCalled();
    });
  });

  describe('GET /api/analyze/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/analyze/[id]/route');
      const request = new Request('http://localhost/api/analyze/contract-1');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 when contract not found', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue(null);

      const { GET } = await import('@/app/api/analyze/[id]/route');
      const request = new Request('http://localhost/api/analyze/contract-1');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(404);
    });

    it('should return PENDING status when analysis not started', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-1',
        userId: 'user-1',
        analysis: null,
      } as never);

      const { GET } = await import('@/app/api/analyze/[id]/route');
      const request = new Request('http://localhost/api/analyze/contract-1');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('PENDING');
    });

    it('should return completed analysis', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-1',
        userId: 'user-1',
        analysis: {
          id: 'analysis-1',
          status: 'COMPLETED',
          summary: 'Complete analysis',
          contractType: 'EMPLOYMENT',
          riskScore: 'MEDIUM',
          keyTerms: [{ term: 'Salary', definition: '$100k' }],
          obligations: [],
          redFlags: [],
          sections: [],
          parties: [],
          dates: [],
          amounts: [],
        },
      } as never);

      const { GET } = await import('@/app/api/analyze/[id]/route');
      const request = new Request('http://localhost/api/analyze/contract-1');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('COMPLETED');
      expect(data.result.summary).toBe('Complete analysis');
      expect(data.result.keyTerms).toHaveLength(1);
    });
  });
});
