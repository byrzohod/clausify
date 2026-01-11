import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth/options', () => ({
  authOptions: {},
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

import { getServerSession } from 'next-auth';
import { analyzeContract, AIError } from '@/lib/ai';

describe('Analyze Compare API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/analyze/compare', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/analyze/compare/route');
      const request = new Request('http://localhost/api/analyze/compare', {
        method: 'POST',
        body: JSON.stringify({
          leftText: 'Contract 1 text',
          rightText: 'Contract 2 text',
        }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when request body is invalid', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { POST } = await import('@/app/api/analyze/compare/route');
      const request = new Request('http://localhost/api/analyze/compare', {
        method: 'POST',
        body: JSON.stringify({
          leftText: '', // Empty string should fail validation
          rightText: 'Contract 2 text',
        }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid request');
    });

    it('should return 400 when rightText is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { POST } = await import('@/app/api/analyze/compare/route');
      const request = new Request('http://localhost/api/analyze/compare', {
        method: 'POST',
        body: JSON.stringify({
          leftText: 'Contract 1 text',
        }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(400);
    });

    it('should analyze both contracts and return comparison', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const mockAnalysisResult = {
        result: {
          summary: 'Test summary',
          contractType: 'NDA',
          riskScore: 'LOW',
          keyTerms: [{ term: 'Confidential', definition: 'Secret info' }],
          obligations: [{ description: 'Keep secrets', party: 'Recipient' }],
          redFlags: [],
          sections: [],
          parties: ['Party A', 'Party B'],
          dates: [],
          amounts: [],
        },
        tokenCount: 500,
        processingTime: 2000,
      };

      vi.mocked(analyzeContract).mockResolvedValue(mockAnalysisResult as never);

      const { POST } = await import('@/app/api/analyze/compare/route');
      const request = new Request('http://localhost/api/analyze/compare', {
        method: 'POST',
        body: JSON.stringify({
          leftText: 'Contract 1 text',
          rightText: 'Contract 2 text',
        }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.left).toBeDefined();
      expect(data.right).toBeDefined();
      expect(data.comparison).toBeDefined();
      expect(data.comparison.riskComparison).toBeDefined();
      expect(data.comparison.redFlagsComparison).toBeDefined();
      expect(data.comparison.obligationsComparison).toBeDefined();
      expect(data.comparison.keyTermsComparison).toBeDefined();
      expect(data.comparison.insights).toBeInstanceOf(Array);

      expect(analyzeContract).toHaveBeenCalledTimes(2);
    });

    it('should return 500 when left analysis fails', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      vi.mocked(analyzeContract)
        .mockRejectedValueOnce(new AIError('Left analysis failed'))
        .mockResolvedValueOnce({
          result: {
            summary: 'Test',
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

      const { POST } = await import('@/app/api/analyze/compare/route');
      const request = new Request('http://localhost/api/analyze/compare', {
        method: 'POST',
        body: JSON.stringify({
          leftText: 'Contract 1 text',
          rightText: 'Contract 2 text',
        }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Analysis failed');
      expect(data.leftError).toBe('Left analysis failed');
    });

    it('should return 500 when right analysis fails', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      vi.mocked(analyzeContract)
        .mockResolvedValueOnce({
          result: {
            summary: 'Test',
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
        } as never)
        .mockRejectedValueOnce(new AIError('Right analysis failed'));

      const { POST } = await import('@/app/api/analyze/compare/route');
      const request = new Request('http://localhost/api/analyze/compare', {
        method: 'POST',
        body: JSON.stringify({
          leftText: 'Contract 1 text',
          rightText: 'Contract 2 text',
        }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Analysis failed');
      expect(data.rightError).toBe('Right analysis failed');
    });

    it('should generate comparison insights for different risk scores', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      vi.mocked(analyzeContract)
        .mockResolvedValueOnce({
          result: {
            summary: 'Test 1',
            contractType: 'NDA',
            riskScore: 'LOW',
            keyTerms: [{ term: 'Term A', definition: 'Def A' }],
            obligations: [],
            redFlags: [{ description: 'Flag 1', severity: 'high' }],
            sections: [],
            parties: [],
            dates: [],
            amounts: [],
          },
          tokenCount: 500,
          processingTime: 2000,
        } as never)
        .mockResolvedValueOnce({
          result: {
            summary: 'Test 2',
            contractType: 'EMPLOYMENT',
            riskScore: 'HIGH',
            keyTerms: [{ term: 'Term B', definition: 'Def B' }],
            obligations: [{}, {}, {}], // 3 obligations
            redFlags: [
              { description: 'Flag 1', severity: 'high' },
              { description: 'Flag 2', severity: 'high' },
            ],
            sections: [],
            parties: [],
            dates: [],
            amounts: [],
          },
          tokenCount: 500,
          processingTime: 2000,
        } as never);

      const { POST } = await import('@/app/api/analyze/compare/route');
      const request = new Request('http://localhost/api/analyze/compare', {
        method: 'POST',
        body: JSON.stringify({
          leftText: 'Contract 1 text',
          rightText: 'Contract 2 text',
        }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.comparison.riskComparison.same).toBe(false);
      expect(data.comparison.insights).toContainEqual(
        expect.stringContaining('Risk level differs')
      );
      expect(data.comparison.insights).toContainEqual(
        expect.stringContaining('Contract types differ')
      );
      expect(data.comparison.insights).toContainEqual(
        expect.stringContaining('High-severity red flags differ')
      );
    });

    it('should handle general errors gracefully', async () => {
      vi.mocked(getServerSession).mockRejectedValue(new Error('Session error'));

      const { POST } = await import('@/app/api/analyze/compare/route');
      const request = new Request('http://localhost/api/analyze/compare', {
        method: 'POST',
        body: JSON.stringify({
          leftText: 'Contract 1 text',
          rightText: 'Contract 2 text',
        }),
      });

      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to analyze contracts');
    });
  });
});
