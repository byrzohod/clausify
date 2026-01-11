// In-memory rate limit store
// Note: This is Edge-runtime compatible and works for single-instance deployments
// For multi-instance deployments, use a separate rate limiting service
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration per endpoint pattern
export const rateLimitConfig: Record<string, { windowMs: number; max: number }> = {
  '/api/auth/signup': { windowMs: 60 * 60 * 1000, max: 10 }, // 10 signups per hour per IP
  '/api/contracts/upload': { windowMs: 60 * 1000, max: 30 }, // 30 uploads per minute per user
  '/api/analyze': { windowMs: 60 * 1000, max: 120 }, // 120 requests per minute (allows polling)
  '/api/demo': { windowMs: 60 * 1000, max: 20 }, // 20 demo requests per minute per user
  '/api/billing': { windowMs: 60 * 1000, max: 30 }, // 30 billing requests per minute
  default: { windowMs: 60 * 1000, max: 200 }, // 200 requests per minute default
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // milliseconds until reset
}

/**
 * Get the rate limit key for a request.
 * Uses userId if authenticated, otherwise falls back to IP.
 */
export function getRateLimitKey(
  pathname: string,
  ip: string,
  userId?: string
): string {
  const prefix = userId ? `user:${userId}` : `ip:${ip}`;
  return `ratelimit:${prefix}:${pathname}`;
}

/**
 * Get the rate limit configuration for a pathname.
 */
export function getRateLimitConfig(pathname: string): { windowMs: number; max: number } {
  for (const [pattern, config] of Object.entries(rateLimitConfig)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }
  return rateLimitConfig.default;
}

/**
 * Check rate limit using in-memory sliding window.
 * Edge-runtime compatible for Next.js middleware.
 */
export async function checkRateLimit(
  key: string,
  config: { windowMs: number; max: number }
): Promise<RateLimitResult> {
  return checkRateLimitMemory(key, config);
}

/**
 * In-memory rate limiting.
 * Uses fixed window for simplicity and Edge-runtime compatibility.
 */
function checkRateLimitMemory(
  key: string,
  config: { windowMs: number; max: number }
): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetIn: config.windowMs };
  }

  if (record.count >= config.max) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.max - record.count,
    resetIn: record.resetTime - now,
  };
}

/**
 * Clear the in-memory rate limit store.
 * Useful for testing.
 */
export function clearMemoryStore(): void {
  memoryStore.clear();
}
