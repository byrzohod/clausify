import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Redis before importing rate-limit
vi.mock('@/lib/redis', () => ({
  getRedis: vi.fn(),
}));

import {
  checkRateLimit,
  getRateLimitKey,
  getRateLimitConfig,
  clearMemoryStore,
  rateLimitConfig,
} from '@/lib/rate-limit';
import { getRedis } from '@/lib/redis';

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMemoryStore();
  });

  afterEach(() => {
    clearMemoryStore();
  });

  describe('getRateLimitKey', () => {
    it('generates user-based key when userId provided', () => {
      const key = getRateLimitKey('/api/contracts/upload', '1.2.3.4', 'user123');
      expect(key).toBe('ratelimit:user:user123:/api/contracts/upload');
    });

    it('generates IP-based key when no userId', () => {
      const key = getRateLimitKey('/api/auth/signup', '192.168.1.1');
      expect(key).toBe('ratelimit:ip:192.168.1.1:/api/auth/signup');
    });
  });

  describe('getRateLimitConfig', () => {
    it('returns signup config for /api/auth/signup', () => {
      const config = getRateLimitConfig('/api/auth/signup');
      expect(config.max).toBe(5);
      expect(config.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });

    it('returns upload config for /api/contracts/upload', () => {
      const config = getRateLimitConfig('/api/contracts/upload');
      expect(config.max).toBe(10);
      expect(config.windowMs).toBe(60 * 1000); // 1 minute
    });

    it('returns analyze config for /api/analyze', () => {
      const config = getRateLimitConfig('/api/analyze');
      expect(config.max).toBe(60);
    });

    it('returns demo config for /api/demo', () => {
      const config = getRateLimitConfig('/api/demo');
      expect(config.max).toBe(10);
    });

    it('returns billing config for /api/billing', () => {
      const config = getRateLimitConfig('/api/billing');
      expect(config.max).toBe(10);
    });

    it('returns default config for unknown paths', () => {
      const config = getRateLimitConfig('/api/unknown');
      expect(config.max).toBe(100);
      expect(config.windowMs).toBe(60 * 1000);
    });
  });

  describe('rateLimitConfig', () => {
    it('has all expected endpoint configurations', () => {
      expect(rateLimitConfig['/api/auth/signup']).toBeDefined();
      expect(rateLimitConfig['/api/contracts/upload']).toBeDefined();
      expect(rateLimitConfig['/api/analyze']).toBeDefined();
      expect(rateLimitConfig['/api/demo']).toBeDefined();
      expect(rateLimitConfig['/api/billing']).toBeDefined();
      expect(rateLimitConfig['default']).toBeDefined();
    });
  });

  describe('checkRateLimit (memory fallback)', () => {
    beforeEach(() => {
      // No Redis available
      vi.mocked(getRedis).mockReturnValue(null);
    });

    it('allows requests under limit', async () => {
      const config = { windowMs: 60000, max: 5 };

      const result1 = await checkRateLimit('test-key', config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = await checkRateLimit('test-key', config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('blocks requests over limit', async () => {
      const config = { windowMs: 60000, max: 2 };

      await checkRateLimit('test-key-2', config);
      await checkRateLimit('test-key-2', config);
      const result = await checkRateLimit('test-key-2', config);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('returns correct remaining count', async () => {
      const config = { windowMs: 60000, max: 3 };

      const r1 = await checkRateLimit('test-key-3', config);
      expect(r1.remaining).toBe(2);

      const r2 = await checkRateLimit('test-key-3', config);
      expect(r2.remaining).toBe(1);

      const r3 = await checkRateLimit('test-key-3', config);
      expect(r3.remaining).toBe(0);
    });

    it('tracks different keys independently', async () => {
      const config = { windowMs: 60000, max: 2 };

      await checkRateLimit('key-a', config);
      await checkRateLimit('key-a', config);

      const resultA = await checkRateLimit('key-a', config);
      const resultB = await checkRateLimit('key-b', config);

      expect(resultA.allowed).toBe(false);
      expect(resultB.allowed).toBe(true);
    });

    it('returns resetIn time', async () => {
      const config = { windowMs: 60000, max: 1 };

      const result = await checkRateLimit('test-key-4', config);
      expect(result.resetIn).toBe(60000);
    });
  });

  describe('checkRateLimit (Redis)', () => {
    it('falls back to memory on Redis error', async () => {
      const mockRedis = {
        multi: vi.fn(() => ({
          zremrangebyscore: vi.fn().mockReturnThis(),
          zadd: vi.fn().mockReturnThis(),
          zcard: vi.fn().mockReturnThis(),
          expire: vi.fn().mockReturnThis(),
          exec: vi.fn().mockRejectedValue(new Error('Connection failed')),
        })),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as never);

      const config = { windowMs: 60000, max: 5 };
      const result = await checkRateLimit('redis-test', config);

      // Should work via memory fallback
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('uses Redis when available', async () => {
      const mockPipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          [null, 0], // zremrangebyscore
          [null, 1], // zadd
          [null, 1], // zcard - 1 request in window
          [null, 1], // expire
        ]),
      };

      const mockRedis = {
        multi: vi.fn(() => mockPipeline),
        zrange: vi.fn().mockResolvedValue(['member', '1704067200000']),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as never);

      const config = { windowMs: 60000, max: 5 };
      const result = await checkRateLimit('redis-test-2', config);

      expect(result.allowed).toBe(true);
      expect(mockRedis.multi).toHaveBeenCalled();
    });

    it('blocks when Redis count exceeds limit', async () => {
      const mockPipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          [null, 0],
          [null, 1],
          [null, 6], // 6 requests - over the limit of 5
          [null, 1],
        ]),
      };

      const mockRedis = {
        multi: vi.fn(() => mockPipeline),
        zrange: vi.fn().mockResolvedValue(['member', String(Date.now())]),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as never);

      const config = { windowMs: 60000, max: 5 };
      const result = await checkRateLimit('redis-test-3', config);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('clearMemoryStore', () => {
    it('clears the in-memory store', async () => {
      vi.mocked(getRedis).mockReturnValue(null);

      const config = { windowMs: 60000, max: 2 };

      await checkRateLimit('clear-test', config);
      await checkRateLimit('clear-test', config);
      const beforeClear = await checkRateLimit('clear-test', config);
      expect(beforeClear.allowed).toBe(false);

      clearMemoryStore();

      const afterClear = await checkRateLimit('clear-test', config);
      expect(afterClear.allowed).toBe(true);
    });
  });
});
