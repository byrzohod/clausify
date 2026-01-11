import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import {
  getCurrentUser,
  createUser,
  canUserAnalyze,
  incrementAnalysisCount,
  getRemainingAnalyses,
} from '@/lib/auth';

describe('Auth Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return null when no session exists', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null when session has no user id', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return user profile when session exists', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        plan: 'FREE',
        analysesUsed: 1,
        analysesLimit: 2,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

      const user = await getCurrentUser();
      expect(user).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          plan: true,
          analysesUsed: true,
          analysesLimit: true,
        },
      });
    });
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      } as never);

      const result = await createUser('test@example.com', 'password123', 'Test User');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed_password',
          name: 'Test User',
        },
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should throw error if user already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      } as never);

      await expect(createUser('test@example.com', 'password123')).rejects.toThrow(
        'User already exists'
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('canUserAnalyze', () => {
    it('should return false when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await canUserAnalyze('non-existent');
      expect(result).toBe(false);
    });

    it('should return true when user has analyses remaining', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        plan: 'FREE',
        analysesUsed: 1,
        analysesLimit: 2,
        subscriptionEnd: null,
      } as never);

      const result = await canUserAnalyze('user-1');
      expect(result).toBe(true);
    });

    it('should return false when user has reached limit', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        plan: 'FREE',
        analysesUsed: 2,
        analysesLimit: 2,
        subscriptionEnd: null,
      } as never);

      const result = await canUserAnalyze('user-1');
      expect(result).toBe(false);
    });

    it('should return false when paid subscription has expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        plan: 'PRO',
        analysesUsed: 5,
        analysesLimit: 100,
        subscriptionEnd: pastDate,
      } as never);

      const result = await canUserAnalyze('user-1');
      expect(result).toBe(false);
    });

    it('should return true when paid subscription is valid', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        plan: 'PRO',
        analysesUsed: 5,
        analysesLimit: 100,
        subscriptionEnd: futureDate,
      } as never);

      const result = await canUserAnalyze('user-1');
      expect(result).toBe(true);
    });
  });

  describe('incrementAnalysisCount', () => {
    it('should increment the analysis count', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      await incrementAnalysisCount('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          analysesUsed: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('getRemainingAnalyses', () => {
    it('should return 0 when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await getRemainingAnalyses('non-existent');
      expect(result).toBe(0);
    });

    it('should return remaining analyses count', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        analysesUsed: 1,
        analysesLimit: 5,
      } as never);

      const result = await getRemainingAnalyses('user-1');
      expect(result).toBe(4);
    });

    it('should return 0 when user has exceeded limit', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        analysesUsed: 10,
        analysesLimit: 5,
      } as never);

      const result = await getRemainingAnalyses('user-1');
      expect(result).toBe(0);
    });
  });
});
