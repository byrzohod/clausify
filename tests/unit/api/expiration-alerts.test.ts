import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    expirationAlert: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

describe('Expiration Alerts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/expiration-alerts', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/expiration-alerts/route');
      const request = new Request('http://localhost/api/expiration-alerts');
      const response = await GET(request as never);

      expect(response.status).toBe(401);
    });

    it('should return all alerts for user', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.expirationAlert.findMany).mockResolvedValue([
        {
          id: 'alert-1',
          contractId: 'contract-1',
          expirationDate: new Date('2026-03-01'),
          alertDays: 30,
          notified: false,
          contract: {
            id: 'contract-1',
            fileName: 'lease.pdf',
            status: 'COMPLETED',
            analysis: { contractType: 'LEASE' },
          },
        },
      ] as never);

      const { GET } = await import('@/app/api/expiration-alerts/route');
      const request = new Request('http://localhost/api/expiration-alerts');
      const response = await GET(request as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.alerts).toHaveLength(1);
      expect(data.alerts[0].contractName).toBe('lease.pdf');
    });

    it('should calculate days until expiration', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.expirationAlert.findMany).mockResolvedValue([
        {
          id: 'alert-1',
          contractId: 'contract-1',
          expirationDate: futureDate,
          alertDays: 30,
          notified: false,
          contract: {
            id: 'contract-1',
            fileName: 'contract.pdf',
            status: 'COMPLETED',
            analysis: null,
          },
        },
      ] as never);

      const { GET } = await import('@/app/api/expiration-alerts/route');
      const request = new Request('http://localhost/api/expiration-alerts');
      const response = await GET(request as never);

      const data = await response.json();
      expect(data.alerts[0].daysUntilExpiration).toBeGreaterThanOrEqual(14);
      expect(data.alerts[0].daysUntilExpiration).toBeLessThanOrEqual(16);
    });

    it('should filter upcoming alerts', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.expirationAlert.findMany).mockResolvedValue([]);

      const { GET } = await import('@/app/api/expiration-alerts/route');
      const request = new Request(
        'http://localhost/api/expiration-alerts?upcoming=true'
      );
      const response = await GET(request as never);

      expect(response.status).toBe(200);
      expect(prisma.expirationAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notified: false,
          }),
        })
      );
    });
  });

  describe('POST /api/expiration-alerts', () => {
    it('should create a new alert', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findFirst).mockResolvedValue({
        id: 'contract-1',
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.expirationAlert.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.expirationAlert.create).mockResolvedValue({
        id: 'alert-1',
        contractId: 'contract-1',
        expirationDate: new Date('2026-06-01'),
        alertDays: 30,
      } as never);

      const { POST } = await import('@/app/api/expiration-alerts/route');
      const request = new Request('http://localhost/api/expiration-alerts', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-1',
          expirationDate: '2026-06-01T00:00:00Z',
          alertDays: 30,
        }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.alert.contractId).toBe('contract-1');
    });

    it('should update existing alert', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findFirst).mockResolvedValue({
        id: 'contract-1',
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.expirationAlert.findUnique).mockResolvedValue({
        id: 'existing-alert',
        contractId: 'contract-1',
      } as never);
      vi.mocked(prisma.expirationAlert.update).mockResolvedValue({
        id: 'existing-alert',
        contractId: 'contract-1',
        expirationDate: new Date('2026-07-01'),
        alertDays: 60,
      } as never);

      const { POST } = await import('@/app/api/expiration-alerts/route');
      const request = new Request('http://localhost/api/expiration-alerts', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-1',
          expirationDate: '2026-07-01T00:00:00Z',
          alertDays: 60,
        }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(200);
      expect(prisma.expirationAlert.update).toHaveBeenCalled();
    });

    it('should return 404 for non-existent contract', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.contract.findFirst).mockResolvedValue(null);

      const { POST } = await import('@/app/api/expiration-alerts/route');
      const request = new Request('http://localhost/api/expiration-alerts', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'nonexistent',
          expirationDate: '2026-06-01T00:00:00Z',
        }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(404);
    });

    it('should validate alert days range', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { POST } = await import('@/app/api/expiration-alerts/route');
      const request = new Request('http://localhost/api/expiration-alerts', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-1',
          expirationDate: '2026-06-01T00:00:00Z',
          alertDays: 500, // Invalid - max is 365
        }),
      });

      const response = await POST(request as never);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/expiration-alerts', () => {
    it('should delete an alert', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.expirationAlert.findFirst).mockResolvedValue({
        id: 'alert-1',
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.expirationAlert.delete).mockResolvedValue({} as never);

      const { DELETE } = await import('@/app/api/expiration-alerts/route');
      const request = new Request(
        'http://localhost/api/expiration-alerts?contractId=contract-1',
        { method: 'DELETE' }
      );

      const response = await DELETE(request as never);

      expect(response.status).toBe(200);
      expect(prisma.expirationAlert.delete).toHaveBeenCalled();
    });

    it('should require contractId parameter', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { DELETE } = await import('@/app/api/expiration-alerts/route');
      const request = new Request('http://localhost/api/expiration-alerts', {
        method: 'DELETE',
      });

      const response = await DELETE(request as never);

      expect(response.status).toBe(400);
    });
  });
});
