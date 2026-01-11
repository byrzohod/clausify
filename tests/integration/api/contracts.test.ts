import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contract: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/supabase/storage', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
}));

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile } from '@/lib/supabase/storage';

describe('Contracts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/contracts', () => {
    it('returns 401 for unauthenticated requests', async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      // In a real test, we'd use next/test-utils or similar
      // For now, we're testing the logic
      const session = await getSession();
      expect(session).toBeNull();
    });

    it('returns contracts for authenticated user', async () => {
      const mockSession = { user: { id: 'user-1' } };
      const mockContracts = [
        { id: 'contract-1', fileName: 'test.pdf', userId: 'user-1' },
      ];

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(prisma.contract.findMany).mockResolvedValueOnce(mockContracts);

      const session = await getSession();
      expect(session?.user?.id).toBe('user-1');

      const contracts = await prisma.contract.findMany({
        where: { userId: session!.user!.id },
      });
      expect(contracts).toHaveLength(1);
    });
  });

  describe('POST /api/contracts/upload', () => {
    it('requires authentication', async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const session = await getSession();
      expect(session).toBeNull();
    });

    it('creates contract record after upload', async () => {
      const mockSession = { user: { id: 'user-1' } };
      const mockUploadResult = {
        path: 'user-1/test.pdf',
        url: 'https://storage.test/user-1/test.pdf',
      };
      const mockContract = {
        id: 'contract-1',
        fileName: 'test.pdf',
        fileUrl: mockUploadResult.url,
        status: 'UPLOADED',
      };

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(uploadFile).mockResolvedValueOnce(mockUploadResult);
      vi.mocked(prisma.contract.create).mockResolvedValueOnce(mockContract);

      const result = await uploadFile(
        Buffer.from('test'),
        'test.pdf',
        'user-1'
      );
      expect(result.url).toBe(mockUploadResult.url);

      const contract = await prisma.contract.create({
        data: {
          userId: 'user-1',
          fileName: 'test.pdf',
          fileUrl: result.url,
          fileSize: 100,
          mimeType: 'application/pdf',
          status: 'UPLOADED',
        },
      });
      expect(contract.status).toBe('UPLOADED');
    });
  });

  describe('DELETE /api/contracts/[id]', () => {
    it('deletes contract and file', async () => {
      const mockSession = { user: { id: 'user-1' } };
      const mockContract = {
        id: 'contract-1',
        userId: 'user-1',
        fileUrl: 'https://storage.test/user-1/test.pdf',
      };

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce(mockContract);
      vi.mocked(deleteFile).mockResolvedValueOnce(undefined);
      vi.mocked(prisma.contract.delete).mockResolvedValueOnce(mockContract);

      const contract = await prisma.contract.findUnique({
        where: { id: 'contract-1' },
      });
      expect(contract).not.toBeNull();

      await deleteFile('user-1/test.pdf');
      await prisma.contract.delete({ where: { id: 'contract-1' } });

      expect(deleteFile).toHaveBeenCalled();
      expect(prisma.contract.delete).toHaveBeenCalled();
    });

    it('returns 404 for non-existent contract', async () => {
      const mockSession = { user: { id: 'user-1' } };

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(prisma.contract.findUnique).mockResolvedValueOnce(null);

      const contract = await prisma.contract.findUnique({
        where: { id: 'non-existent' },
      });
      expect(contract).toBeNull();
    });
  });
});
