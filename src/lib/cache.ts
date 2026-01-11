/**
 * HTTP caching utilities for API responses
 */

export type CacheStrategy =
  | 'no-store' // Never cache (mutations, sensitive data)
  | 'private-no-cache' // Private, must revalidate (user-specific data)
  | 'private-short' // Private, short cache (user data that rarely changes)
  | 'public-short' // Public, short cache (shared data)
  | 'public-long'; // Public, long cache (static data)

const CACHE_HEADERS: Record<CacheStrategy, string> = {
  'no-store': 'no-store, no-cache, must-revalidate',
  'private-no-cache': 'private, no-cache, must-revalidate',
  'private-short': 'private, max-age=60, stale-while-revalidate=30',
  'public-short': 'public, max-age=300, stale-while-revalidate=60',
  'public-long': 'public, max-age=86400, stale-while-revalidate=3600',
};

/**
 * Get Cache-Control header value for a given strategy
 */
export function getCacheHeader(strategy: CacheStrategy): string {
  return CACHE_HEADERS[strategy];
}

/**
 * Create headers object with cache control
 */
export function createCacheHeaders(
  strategy: CacheStrategy
): Record<string, string> {
  return {
    'Cache-Control': getCacheHeader(strategy),
  };
}

/**
 * Add cache headers to an existing Headers object or create new one
 */
export function withCacheHeaders(
  strategy: CacheStrategy,
  existingHeaders?: HeadersInit
): Headers {
  const headers = new Headers(existingHeaders);
  headers.set('Cache-Control', getCacheHeader(strategy));
  return headers;
}
