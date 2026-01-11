import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    analysis: {
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  generateContentHash,
  getCachedAnalysis,
  storeContentHash,
  getCacheStats,
} from '@/lib/ai/analysis-cache';

describe('Analysis Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateContentHash', () => {
    it('generates consistent hash for same content', () => {
      const text = 'This is a sample contract text.';
      const hash1 = generateContentHash(text);
      const hash2 = generateContentHash(text);
      expect(hash1).toBe(hash2);
    });

    it('generates different hash for different content', () => {
      const hash1 = generateContentHash('Contract A');
      const hash2 = generateContentHash('Contract B');
      expect(hash1).not.toBe(hash2);
    });

    it('normalizes whitespace before hashing', () => {
      const text1 = 'Contract   with   extra   spaces';
      const text2 = 'Contract with extra spaces';
      expect(generateContentHash(text1)).toBe(generateContentHash(text2));
    });

    it('is case-insensitive', () => {
      const text1 = 'Contract Agreement';
      const text2 = 'contract agreement';
      expect(generateContentHash(text1)).toBe(generateContentHash(text2));
    });

    it('trims leading and trailing whitespace', () => {
      const text1 = '   Contract   ';
      const text2 = 'Contract';
      expect(generateContentHash(text1)).toBe(generateContentHash(text2));
    });

    it('returns a 64-character hex string (SHA-256)', () => {
      const hash = generateContentHash('test');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('getCachedAnalysis', () => {
    const mockAnalysis = {
      id: 'analysis-123',
      contentHash: 'abc123',
      status: 'COMPLETED',
      summary: 'This is a summary',
      contractType: 'NDA',
      riskScore: 'LOW',
      keyTerms: [{ term: 'Term 1', value: 'Value 1' }],
      obligations: [],
      redFlags: [],
      sections: [],
      parties: [],
      dates: [],
      amounts: [],
      createdAt: new Date(),
    };

    it('returns cached analysis when found', async () => {
      vi.mocked(prisma.analysis.findFirst).mockResolvedValue(mockAnalysis as never);

      const result = await getCachedAnalysis('abc123');

      expect(result).not.toBeNull();
      expect(result?.summary).toBe('This is a summary');
      expect(result?.contractType).toBe('NDA');
      expect(result?.riskScore).toBe('LOW');
    });

    it('returns null when no cache found', async () => {
      vi.mocked(prisma.analysis.findFirst).mockResolvedValue(null);

      const result = await getCachedAnalysis('nonexistent');

      expect(result).toBeNull();
    });

    it('queries with correct parameters', async () => {
      vi.mocked(prisma.analysis.findFirst).mockResolvedValue(null);

      await getCachedAnalysis('test-hash');

      expect(prisma.analysis.findFirst).toHaveBeenCalledWith({
        where: {
          contentHash: 'test-hash',
          status: 'COMPLETED',
          createdAt: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('handles database errors gracefully', async () => {
      vi.mocked(prisma.analysis.findFirst).mockRejectedValue(new Error('DB error'));

      const result = await getCachedAnalysis('test-hash');

      expect(result).toBeNull();
    });

    it('returns default values for missing fields', async () => {
      const incompleteAnalysis = {
        id: 'analysis-123',
        contentHash: 'abc123',
        status: 'COMPLETED',
        summary: null,
        contractType: null,
        riskScore: null,
        keyTerms: null,
        obligations: null,
        redFlags: null,
        sections: null,
        parties: null,
        dates: null,
        amounts: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.analysis.findFirst).mockResolvedValue(incompleteAnalysis as never);

      const result = await getCachedAnalysis('abc123');

      expect(result?.summary).toBe('');
      expect(result?.contractType).toBe('OTHER');
      expect(result?.riskScore).toBe('MEDIUM');
      expect(result?.keyTerms).toEqual([]);
    });
  });

  describe('storeContentHash', () => {
    it('updates analysis with content hash', async () => {
      vi.mocked(prisma.analysis.update).mockResolvedValue({} as never);

      await storeContentHash('analysis-123', 'hash-abc');

      expect(prisma.analysis.update).toHaveBeenCalledWith({
        where: { id: 'analysis-123' },
        data: { contentHash: 'hash-abc' },
      });
    });

    it('handles database errors gracefully', async () => {
      vi.mocked(prisma.analysis.update).mockRejectedValue(new Error('DB error'));

      // Should not throw
      await expect(storeContentHash('analysis-123', 'hash')).resolves.not.toThrow();
    });
  });

  describe('getCacheStats', () => {
    it('returns cache statistics', async () => {
      vi.mocked(prisma.analysis.count)
        .mockResolvedValueOnce(100) // totalCached
        .mockResolvedValueOnce(80); // validCache

      const stats = await getCacheStats();

      expect(stats.totalCached).toBe(100);
      expect(stats.validCache).toBe(80);
      expect(stats.expiredCache).toBe(20);
    });

    it('queries with correct parameters', async () => {
      vi.mocked(prisma.analysis.count).mockResolvedValue(0);

      await getCacheStats();

      expect(prisma.analysis.count).toHaveBeenCalledTimes(2);

      // First call - total cached
      expect(prisma.analysis.count).toHaveBeenNthCalledWith(1, {
        where: {
          contentHash: { not: null },
          status: 'COMPLETED',
        },
      });

      // Second call - valid cache (with date filter)
      expect(prisma.analysis.count).toHaveBeenNthCalledWith(2, {
        where: {
          contentHash: { not: null },
          status: 'COMPLETED',
          createdAt: { gte: expect.any(Date) },
        },
      });
    });
  });
});
