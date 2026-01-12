/**
 * Tests for API key management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateApiKey, hashApiKey } from '@/lib/api-keys';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    apiKey: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    apiUsage: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma);

describe('API Keys', () => {
  describe('generateApiKey', () => {
    it('generates a key with correct prefix', () => {
      const { key, hash, prefix } = generateApiKey();

      expect(key).toMatch(/^clsf_/);
      expect(prefix).toMatch(/^clsf_/);
      expect(prefix.length).toBe(12);
    });

    it('generates unique keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();

      expect(key1.key).not.toBe(key2.key);
      expect(key1.hash).not.toBe(key2.hash);
    });

    it('generates valid hash', () => {
      const { key, hash } = generateApiKey();

      // Hash should be 64 characters (SHA-256 hex)
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('hashApiKey', () => {
    it('produces consistent hashes for same input', () => {
      const key = 'clsf_test_key_123';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);

      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', () => {
      const hash1 = hashApiKey('clsf_key1');
      const hash2 = hashApiKey('clsf_key2');

      expect(hash1).not.toBe(hash2);
    });

    it('returns SHA-256 hex hash', () => {
      const hash = hashApiKey('test');

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });
});

describe('API Key Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createApiKey', () => {
    it('creates API key with correct data', async () => {
      const { createApiKey } = await import('@/lib/api-keys');

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@test.com' } as any);
      mockPrisma.apiKey.count.mockResolvedValue(0);
      mockPrisma.apiKey.create.mockResolvedValue({
        id: 'key-1',
        userId: 'user-1',
        name: 'Test Key',
        key: 'hashed_key',
        prefix: 'clsf_abcd1234',
        lastUsed: null,
        expiresAt: null,
        rateLimit: 100,
        isActive: true,
        createdAt: new Date(),
      } as any);

      const result = await createApiKey({
        userId: 'user-1',
        name: 'Test Key',
      });

      expect(result.apiKey.name).toBe('Test Key');
      expect(result.secretKey).toMatch(/^clsf_/);
      expect(mockPrisma.apiKey.create).toHaveBeenCalled();
    });

    it('rejects when user not found', async () => {
      const { createApiKey } = await import('@/lib/api-keys');

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        createApiKey({ userId: 'nonexistent', name: 'Test' })
      ).rejects.toThrow('User not found');
    });

    it('rejects when API key limit reached', async () => {
      const { createApiKey } = await import('@/lib/api-keys');

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' } as any);
      mockPrisma.apiKey.count.mockResolvedValue(5);

      await expect(
        createApiKey({ userId: 'user-1', name: 'Test' })
      ).rejects.toThrow('Maximum API keys limit reached');
    });
  });

  describe('validateApiKey', () => {
    it('validates a correct API key', async () => {
      const { validateApiKey, hashApiKey } = await import('@/lib/api-keys');

      const testKey = 'clsf_test_key_123';
      const hashedKey = hashApiKey(testKey);

      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        userId: 'user-1',
        name: 'Test Key',
        key: hashedKey,
        isActive: true,
        expiresAt: null,
        rateLimit: 100,
        user: { id: 'user-1' },
      } as any);

      mockPrisma.apiKey.update.mockResolvedValue({} as any);

      const result = await validateApiKey(testKey);

      expect(result.valid).toBe(true);
      expect(result.apiKey?.userId).toBe('user-1');
    });

    it('rejects invalid format', async () => {
      const { validateApiKey } = await import('@/lib/api-keys');

      const result = await validateApiKey('invalid_key');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key format');
    });

    it('rejects inactive key', async () => {
      const { validateApiKey } = await import('@/lib/api-keys');

      const testKey = 'clsf_inactive_key';

      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        isActive: false,
      } as any);

      const result = await validateApiKey(testKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key is inactive');
    });

    it('rejects expired key', async () => {
      const { validateApiKey } = await import('@/lib/api-keys');

      const testKey = 'clsf_expired_key';
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        isActive: true,
        expiresAt: pastDate,
      } as any);

      const result = await validateApiKey(testKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key has expired');
    });
  });

  describe('listApiKeys', () => {
    it('returns formatted list of keys', async () => {
      const { listApiKeys } = await import('@/lib/api-keys');

      mockPrisma.apiKey.findMany.mockResolvedValue([
        {
          id: 'key-1',
          name: 'Key 1',
          prefix: 'clsf_abcd',
          lastUsed: null,
          expiresAt: null,
          rateLimit: 100,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'key-2',
          name: 'Key 2',
          prefix: 'clsf_efgh',
          lastUsed: new Date(),
          expiresAt: null,
          rateLimit: 200,
          isActive: true,
          createdAt: new Date(),
        },
      ] as any);

      const keys = await listApiKeys('user-1');

      expect(keys).toHaveLength(2);
      expect(keys[0].name).toBe('Key 1');
      expect(keys[1].name).toBe('Key 2');
    });
  });

  describe('revokeApiKey', () => {
    it('revokes an existing key', async () => {
      const { revokeApiKey } = await import('@/lib/api-keys');

      mockPrisma.apiKey.findFirst.mockResolvedValue({ id: 'key-1' } as any);
      mockPrisma.apiKey.update.mockResolvedValue({} as any);

      const result = await revokeApiKey('user-1', 'key-1');

      expect(result).toBe(true);
      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { isActive: false },
      });
    });

    it('returns false for non-existent key', async () => {
      const { revokeApiKey } = await import('@/lib/api-keys');

      mockPrisma.apiKey.findFirst.mockResolvedValue(null);

      const result = await revokeApiKey('user-1', 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('deleteApiKey', () => {
    it('deletes an existing key', async () => {
      const { deleteApiKey } = await import('@/lib/api-keys');

      mockPrisma.apiKey.findFirst.mockResolvedValue({ id: 'key-1' } as any);
      mockPrisma.apiKey.delete.mockResolvedValue({} as any);

      const result = await deleteApiKey('user-1', 'key-1');

      expect(result).toBe(true);
      expect(mockPrisma.apiKey.delete).toHaveBeenCalledWith({
        where: { id: 'key-1' },
      });
    });
  });

  describe('getApiUsageStats', () => {
    it('calculates usage statistics correctly', async () => {
      const { getApiUsageStats } = await import('@/lib/api-keys');

      mockPrisma.apiUsage.findMany.mockResolvedValue([
        { status: 200, duration: 100 },
        { status: 201, duration: 150 },
        { status: 400, duration: 50 },
        { status: 500, duration: 200 },
      ] as any);

      const stats = await getApiUsageStats('key-1', 30);

      expect(stats.totalRequests).toBe(4);
      expect(stats.successfulRequests).toBe(2);
      expect(stats.failedRequests).toBe(2);
      expect(stats.avgDuration).toBe(125); // (100 + 150 + 50 + 200) / 4
    });

    it('handles empty usage', async () => {
      const { getApiUsageStats } = await import('@/lib/api-keys');

      mockPrisma.apiUsage.findMany.mockResolvedValue([]);

      const stats = await getApiUsageStats('key-1', 30);

      expect(stats.totalRequests).toBe(0);
      expect(stats.avgDuration).toBe(0);
    });
  });
});
