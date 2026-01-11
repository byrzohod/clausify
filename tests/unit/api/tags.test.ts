import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tag: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    contractTag: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    contract: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

describe('Tags API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/tags', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/tags/route');
      const response = await GET();

      expect(response.status).toBe(401);
    });

    it('should return list of tags with contract counts', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.tag.findMany).mockResolvedValue([
        {
          id: 'tag-1',
          userId: 'user-1',
          name: 'Important',
          color: '#ff0000',
          createdAt: new Date(),
          _count: { contracts: 5 },
        },
        {
          id: 'tag-2',
          userId: 'user-1',
          name: 'Review',
          color: '#00ff00',
          createdAt: new Date(),
          _count: { contracts: 3 },
        },
      ] as never);

      const { GET } = await import('@/app/api/tags/route');
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tags).toHaveLength(2);
      expect(data.tags[0].name).toBe('Important');
      expect(data.tags[0].contractCount).toBe(5);
    });
  });

  describe('POST /api/tags', () => {
    it('should create a new tag', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.tag.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 'tag-1',
        userId: 'user-1',
        name: 'New Tag',
        color: '#6366f1',
        createdAt: new Date(),
      } as never);

      const { POST } = await import('@/app/api/tags/route');
      const request = new Request('http://localhost/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Tag' }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.tag.name).toBe('New Tag');
    });

    it('should return 409 for duplicate tag name', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 'existing-tag',
        name: 'Existing',
      } as never);

      const { POST } = await import('@/app/api/tags/route');
      const request = new Request('http://localhost/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'Existing' }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(409);
    });

    it('should validate tag name', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { POST } = await import('@/app/api/tags/route');
      const request = new Request('http://localhost/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(400);
    });

    it('should validate color format', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { POST } = await import('@/app/api/tags/route');
      const request = new Request('http://localhost/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', color: 'invalid' }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/tags/[id]', () => {
    it('should delete a tag', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.tag.findFirst).mockResolvedValue({
        id: 'tag-1',
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.tag.delete).mockResolvedValue({} as never);

      const { DELETE } = await import('@/app/api/tags/[id]/route');
      const request = new Request('http://localhost/api/tags/tag-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request as never, {
        params: Promise.resolve({ id: 'tag-1' }),
      });

      expect(response.status).toBe(200);
      expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: 'tag-1' } });
    });

    it('should return 404 for non-existent tag', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.tag.findFirst).mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/tags/[id]/route');
      const request = new Request('http://localhost/api/tags/tag-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request as never, {
        params: Promise.resolve({ id: 'tag-1' }),
      });

      expect(response.status).toBe(404);
    });
  });
});
