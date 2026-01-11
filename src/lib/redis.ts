import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Get the Redis client singleton.
 * Returns null if REDIS_URL is not configured.
 * Uses lazy connection to avoid blocking startup.
 */
export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        // Exponential backoff, max 3 seconds
        return Math.min(times * 100, 3000);
      },
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }

  return redis;
}

/**
 * Check if Redis is available and connected.
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Close the Redis connection gracefully.
 * Call this during shutdown.
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
