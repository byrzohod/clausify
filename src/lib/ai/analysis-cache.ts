import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { AnalysisResult } from '@/types';

// Cache expiry: 30 days (in milliseconds)
const CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Generate a content hash for contract text.
 * Uses SHA-256 to create a unique identifier for the content.
 */
export function generateContentHash(text: string): string {
  // Normalize text: trim, lowercase, remove extra whitespace
  const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return createHash('sha256').update(normalizedText).digest('hex');
}

/**
 * Check if we have a cached analysis for this content hash.
 * Returns null if no cache exists or cache is expired.
 */
export async function getCachedAnalysis(
  contentHash: string
): Promise<AnalysisResult | null> {
  try {
    // Look for a completed analysis with matching content hash
    const cachedAnalysis = await prisma.analysis.findFirst({
      where: {
        contentHash,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - CACHE_EXPIRY_MS),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!cachedAnalysis) {
      return null;
    }

    // Return the cached result
    return {
      summary: cachedAnalysis.summary || '',
      contractType: cachedAnalysis.contractType || 'OTHER',
      riskScore: cachedAnalysis.riskScore || 'MEDIUM',
      keyTerms: (cachedAnalysis.keyTerms as AnalysisResult['keyTerms']) || [],
      obligations: (cachedAnalysis.obligations as AnalysisResult['obligations']) || [],
      redFlags: (cachedAnalysis.redFlags as AnalysisResult['redFlags']) || [],
      sections: (cachedAnalysis.sections as AnalysisResult['sections']) || [],
      parties: (cachedAnalysis.parties as AnalysisResult['parties']) || [],
      dates: (cachedAnalysis.dates as AnalysisResult['dates']) || [],
      amounts: (cachedAnalysis.amounts as AnalysisResult['amounts']) || [],
    };
  } catch (error) {
    console.error('[AnalysisCache] Error checking cache:', error);
    return null;
  }
}

/**
 * Store a content hash with an analysis for future cache lookups.
 */
export async function storeContentHash(
  analysisId: string,
  contentHash: string
): Promise<void> {
  try {
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { contentHash },
    });
  } catch (error) {
    console.error('[AnalysisCache] Error storing content hash:', error);
  }
}

/**
 * Get cache statistics for monitoring.
 */
export async function getCacheStats(): Promise<{
  totalCached: number;
  validCache: number;
  expiredCache: number;
}> {
  const now = new Date();
  const expiryDate = new Date(now.getTime() - CACHE_EXPIRY_MS);

  const [totalCached, validCache] = await Promise.all([
    prisma.analysis.count({
      where: {
        contentHash: { not: null },
        status: 'COMPLETED',
      },
    }),
    prisma.analysis.count({
      where: {
        contentHash: { not: null },
        status: 'COMPLETED',
        createdAt: { gte: expiryDate },
      },
    }),
  ]);

  return {
    totalCached,
    validCache,
    expiredCache: totalCached - validCache,
  };
}
