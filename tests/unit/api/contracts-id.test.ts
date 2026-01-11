import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    contract: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/storage', () => ({
  deleteFile: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { deleteFile } from '@/lib/supabase/storage';

describe('Contracts [id] API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/contracts/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/contracts/[id]/route');
      const request = new Request('http://localhost/api/contracts/contract-1');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 when contract not found', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue(null);

      const { GET } = await import('@/app/api/contracts/[id]/route');
      const request = new Request('http://localhost/api/contracts/contract-1');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(404);
    });

    it('should return contract with analysis', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileUrl: '/uploads/user-1/test.pdf',
        analysis: {
          id: 'analysis-1',
          status: 'COMPLETED',
          summary: 'Test summary',
        },
      } as never);

      const { GET } = await import('@/app/api/contracts/[id]/route');
      const request = new Request('http://localhost/api/contracts/contract-1');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.contract.id).toBe('contract-1');
      expect(data.contract.analysis.status).toBe('COMPLETED');
    });

    it('should only return contracts owned by user', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue(null);

      const { GET } = await import('@/app/api/contracts/[id]/route');
      const request = new Request('http://localhost/api/contracts/other-user-contract');

      const response = await GET(
        request as Parameters<typeof GET>[0],
        { params: Promise.resolve({ id: 'other-user-contract' }) }
      );

      expect(response.status).toBe(404);
      expect(prisma.contract.findUnique).toHaveBeenCalledWith({
        where: { id: 'other-user-contract', userId: 'user-1' },
        include: { analysis: true },
      });
    });
  });

  describe('DELETE /api/contracts/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/contracts/[id]/route');
      const request = new Request('http://localhost/api/contracts/contract-1', {
        method: 'DELETE',
      });

      const response = await DELETE(
        request as Parameters<typeof DELETE>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 when contract not found', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/contracts/[id]/route');
      const request = new Request('http://localhost/api/contracts/contract-1', {
        method: 'DELETE',
      });

      const response = await DELETE(
        request as Parameters<typeof DELETE>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(404);
    });

    it('should delete contract and file', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-1',
        userId: 'user-1',
        fileUrl: '/uploads/user-1/test.pdf',
      } as never);
      vi.mocked(deleteFile).mockResolvedValue(undefined);
      vi.mocked(prisma.contract.delete).mockResolvedValue({} as never);

      const { DELETE } = await import('@/app/api/contracts/[id]/route');
      const request = new Request('http://localhost/api/contracts/contract-1', {
        method: 'DELETE',
      });

      const response = await DELETE(
        request as Parameters<typeof DELETE>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Contract deleted');

      expect(deleteFile).toHaveBeenCalledWith('user-1/test.pdf');
      expect(prisma.contract.delete).toHaveBeenCalledWith({
        where: { id: 'contract-1', userId: 'user-1' },
      });
    });

    it('should continue deletion even if file delete fails', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findUnique).mockResolvedValue({
        id: 'contract-1',
        userId: 'user-1',
        fileUrl: '/uploads/user-1/test.pdf',
      } as never);
      vi.mocked(deleteFile).mockRejectedValue(new Error('Storage error'));
      vi.mocked(prisma.contract.delete).mockResolvedValue({} as never);

      const { DELETE } = await import('@/app/api/contracts/[id]/route');
      const request = new Request('http://localhost/api/contracts/contract-1', {
        method: 'DELETE',
      });

      const response = await DELETE(
        request as Parameters<typeof DELETE>[0],
        { params: Promise.resolve({ id: 'contract-1' }) }
      );

      // Should still succeed
      expect(response.status).toBe(200);
      expect(prisma.contract.delete).toHaveBeenCalled();
    });
  });
});
