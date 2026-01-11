import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    contract: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

describe('Contract Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/contracts/search', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/contracts/search/route');
      const request = new Request('http://localhost/api/contracts/search', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(401);
    });

    it('should search contracts by filename', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.count).mockResolvedValue(1);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([
        {
          id: 'contract-1',
          userId: 'user-1',
          fileName: 'nda-contract.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          status: 'COMPLETED',
          createdAt: new Date(),
          analysis: {
            id: 'analysis-1',
            status: 'COMPLETED',
            contractType: 'NDA',
            riskScore: 'LOW',
            summary: 'Test summary',
          },
          tags: [],
        },
      ] as never);

      const { POST } = await import('@/app/api/contracts/search/route');
      const request = new Request('http://localhost/api/contracts/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'nda' }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.contracts).toHaveLength(1);
      expect(data.contracts[0].fileName).toBe('nda-contract.pdf');
      expect(data.pagination.totalCount).toBe(1);
    });

    it('should filter by contract type', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.count).mockResolvedValue(2);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([
        {
          id: 'contract-1',
          fileName: 'employment.pdf',
          analysis: { contractType: 'EMPLOYMENT' },
          tags: [],
        },
        {
          id: 'contract-2',
          fileName: 'employment2.pdf',
          analysis: { contractType: 'EMPLOYMENT' },
          tags: [],
        },
      ] as never);

      const { POST } = await import('@/app/api/contracts/search/route');
      const request = new Request('http://localhost/api/contracts/search', {
        method: 'POST',
        body: JSON.stringify({ contractType: 'EMPLOYMENT' }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.contracts).toHaveLength(2);
    });

    it('should filter by tags', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.count).mockResolvedValue(1);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([
        {
          id: 'contract-1',
          fileName: 'tagged.pdf',
          analysis: null,
          tags: [{ tag: { id: 'tag-1', name: 'Important', color: '#ff0000' } }],
        },
      ] as never);

      const { POST } = await import('@/app/api/contracts/search/route');
      const request = new Request('http://localhost/api/contracts/search', {
        method: 'POST',
        body: JSON.stringify({ tagIds: ['tag-1'] }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.contracts).toHaveLength(1);
      expect(data.contracts[0].tags).toHaveLength(1);
    });

    it('should support pagination', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.count).mockResolvedValue(50);
      vi.mocked(prisma.contract.findMany).mockResolvedValue(
        Array(20).fill({
          id: 'contract-1',
          fileName: 'test.pdf',
          analysis: null,
          tags: [],
        })
      );

      const { POST } = await import('@/app/api/contracts/search/route');
      const request = new Request('http://localhost/api/contracts/search', {
        method: 'POST',
        body: JSON.stringify({ page: 1, limit: 20 }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
      expect(data.pagination.totalCount).toBe(50);
      expect(data.pagination.totalPages).toBe(3);
      expect(data.pagination.hasMore).toBe(true);
    });

    it('should filter by date range', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.count).mockResolvedValue(1);
      vi.mocked(prisma.contract.findMany).mockResolvedValue([
        {
          id: 'contract-1',
          fileName: 'recent.pdf',
          analysis: null,
          tags: [],
        },
      ] as never);

      const { POST } = await import('@/app/api/contracts/search/route');
      const request = new Request('http://localhost/api/contracts/search', {
        method: 'POST',
        body: JSON.stringify({
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-12-31T23:59:59Z',
        }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(200);
    });
  });
});
