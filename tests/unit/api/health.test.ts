import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the route
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { GET } from '@/app/api/health/route';
import { prisma } from '@/lib/prisma';

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy when database is connected', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '1': 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.database.status).toBe('up');
    expect(data.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(data.timestamp).toBeDefined();
  });

  it('returns unhealthy when database fails', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection failed'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.checks.database.status).toBe('down');
    expect(data.checks.database.error).toBe('Connection failed');
    expect(data.timestamp).toBeDefined();
  });
});
