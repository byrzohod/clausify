import { getRedis } from './redis';

// In-memory fallback store (used when Redis is unavailable)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration per endpoint pattern
export const rateLimitConfig: Record<string, { windowMs: number; max: number }> = {
  '/api/auth/signup': { windowMs: 60 * 60 * 1000, max: 5 }, // 5 signups per hour per IP
  '/api/contracts/upload': { windowMs: 60 * 1000, max: 10 }, // 10 uploads per minute per user
  '/api/analyze': { windowMs: 60 * 1000, max: 60 }, // 60 requests per minute (allows polling)
  '/api/demo': { windowMs: 60 * 1000, max: 10 }, // 10 demo requests per minute per user
  '/api/billing': { windowMs: 60 * 1000, max: 10 }, // 10 billing requests per minute
  default: { windowMs: 60 * 1000, max: 100 }, // 100 requests per minute default
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
 * Check rate limit using Redis sliding window counter.
 * Falls back to in-memory store if Redis is unavailable.
 */
export async function checkRateLimit(
  key: string,
  config: { windowMs: number; max: number }
): Promise<RateLimitResult> {
  const redis = getRedis();

  if (redis) {
    try {
      return await checkRateLimitRedis(redis, key, config);
    } catch (error) {
      console.error('[RateLimit] Redis error, falling back to memory:', error);
      return checkRateLimitMemory(key, config);
    }
  }

  return checkRateLimitMemory(key, config);
}

/**
 * Redis-based sliding window rate limiting.
 * Uses atomic MULTI/EXEC for consistency.
 */
async function checkRateLimitRedis(
  redis: import('ioredis').default,
  key: string,
  config: { windowMs: number; max: number }
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const windowKey = `${key}:window`;

  // Sliding window using sorted set:
  // - Score = timestamp
  // - Member = unique request ID (timestamp + random)
  const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

  const pipeline = redis.multi();

  // Remove old entries outside the window
  pipeline.zremrangebyscore(windowKey, '-inf', windowStart);

  // Add current request
  pipeline.zadd(windowKey, now, member);

  // Count requests in window
  pipeline.zcard(windowKey);

  // Set expiry to prevent memory leak
  pipeline.expire(windowKey, Math.ceil(config.windowMs / 1000) + 1);

  const results = await pipeline.exec();

  if (!results) {
    throw new Error('Redis pipeline returned null');
  }

  // Get the count from the third command (zcard)
  const countResult = results[2];
  const count = countResult ? (countResult[1] as number) : 0;

  const allowed = count <= config.max;
  const remaining = Math.max(0, config.max - count);

  // Get the oldest entry to calculate reset time
  const oldest = await redis.zrange(windowKey, 0, 0, 'WITHSCORES');
  let resetIn = config.windowMs;

  if (oldest && oldest.length >= 2) {
    const oldestTime = parseInt(oldest[1], 10);
    resetIn = Math.max(0, oldestTime + config.windowMs - now);
  }

  return { allowed, remaining, resetIn };
}

/**
 * In-memory rate limiting (fallback).
 * Uses fixed window for simplicity.
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
