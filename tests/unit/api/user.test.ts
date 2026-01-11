import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  getRemainingAnalyses: vi.fn(),
}));

import { getCurrentUser, getRemainingAnalyses } from '@/lib/auth';

describe('User API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/user', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const { GET } = await import('@/app/api/user/route');
      const response = await GET();

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return user profile with remaining analyses', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        plan: 'PRO',
        analysesUsed: 5,
        analysesLimit: 100,
      });
      vi.mocked(getRemainingAnalyses).mockResolvedValue(95);

      const { GET } = await import('@/app/api/user/route');
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.id).toBe('user-1');
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.plan).toBe('PRO');
      expect(data.user.remainingAnalyses).toBe(95);
    });

    it('should return free user with limited analyses', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-2',
        email: 'free@example.com',
        name: 'Free User',
        image: null,
        plan: 'FREE',
        analysesUsed: 1,
        analysesLimit: 2,
      });
      vi.mocked(getRemainingAnalyses).mockResolvedValue(1);

      const { GET } = await import('@/app/api/user/route');
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.plan).toBe('FREE');
      expect(data.user.remainingAnalyses).toBe(1);
    });

    it('should return 0 remaining when limit reached', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-3',
        email: 'exhausted@example.com',
        name: 'Exhausted User',
        image: null,
        plan: 'FREE',
        analysesUsed: 2,
        analysesLimit: 2,
      });
      vi.mocked(getRemainingAnalyses).mockResolvedValue(0);

      const { GET } = await import('@/app/api/user/route');
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.remainingAnalyses).toBe(0);
    });

    it('should handle database error gracefully', async () => {
      vi.mocked(getCurrentUser).mockRejectedValue(new Error('Database error'));

      const { GET } = await import('@/app/api/user/route');
      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch user');
    });
  });
});
