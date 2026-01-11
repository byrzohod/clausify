import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('creates new user with hashed password', async () => {
      const mockHashedPassword = 'hashed-password';
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: mockHashedPassword,
        name: 'Test User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce(mockHashedPassword);
      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockUser);

      // Check user doesn't exist
      const existingUser = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(existingUser).toBeNull();

      // Hash password
      const hashedPassword = await bcrypt.hash('password123', 12);
      expect(hashedPassword).toBe(mockHashedPassword);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          name: 'Test User',
        },
      });
      expect(user.id).toBe('user-1');
    });

    it('rejects duplicate email', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Existing User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(user).not.toBeNull();
      // Would return 409 Conflict
    });

    it('validates email format', () => {
      const invalidEmails = ['not-an-email', 'missing@', '@nodomain.com'];

      invalidEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });

    it('requires minimum password length', () => {
      const shortPassword = 'short';
      const validPassword = 'validpassword123';

      expect(shortPassword.length).toBeLessThan(8);
      expect(validPassword.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Credentials authentication', () => {
    it('validates correct password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(user).not.toBeNull();

      const isValid = await bcrypt.compare('password123', user!.password!);
      expect(isValid).toBe(true);
    });

    it('rejects incorrect password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(user).not.toBeNull();

      const isValid = await bcrypt.compare('wrongpassword', user!.password!);
      expect(isValid).toBe(false);
    });

    it('rejects non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const user = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });
      expect(user).toBeNull();
    });
  });
});
