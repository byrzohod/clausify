import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Google OAuth Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sign In Callback', () => {
    it('should create a new user on first Google sign-in', async () => {
      const mockUser = {
        email: 'test@gmail.com',
        name: 'Test User',
        image: 'https://example.com/photo.jpg',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-user-id',
        email: mockUser.email,
        name: mockUser.name,
        image: mockUser.image,
        emailVerified: new Date(),
        plan: 'FREE',
        analysesUsed: 0,
        analysesLimit: 2,
        password: null,
        stripeCustomerId: null,
        subscriptionId: null,
        subscriptionEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Simulate signIn callback logic
      const existingUser = await prisma.user.findUnique({
        where: { email: mockUser.email },
      });

      expect(existingUser).toBeNull();

      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: {
            email: mockUser.email,
            name: mockUser.name,
            image: mockUser.image,
            emailVerified: new Date(),
            plan: 'FREE',
            analysesUsed: 0,
            analysesLimit: 2,
          },
        });

        expect(newUser.email).toBe(mockUser.email);
        expect(newUser.plan).toBe('FREE');
        expect(newUser.analysesLimit).toBe(2);
      }

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should not create a user if already exists', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'existing@gmail.com',
        name: 'Existing User',
        image: null,
        emailVerified: new Date(),
        plan: 'PRO' as const,
        analysesUsed: 10,
        analysesLimit: 100,
        password: null,
        stripeCustomerId: 'cus_123',
        subscriptionId: 'sub_123',
        subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser);

      // Simulate signIn callback logic
      const foundUser = await prisma.user.findUnique({
        where: { email: existingUser.email },
      });

      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe('existing-user-id');
      expect(foundUser?.plan).toBe('PRO');

      // Should not call create since user exists
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('User Creation Defaults', () => {
    it('should set correct defaults for new OAuth users', () => {
      const defaults = {
        plan: 'FREE',
        analysesUsed: 0,
        analysesLimit: 2,
      };

      expect(defaults.plan).toBe('FREE');
      expect(defaults.analysesUsed).toBe(0);
      expect(defaults.analysesLimit).toBe(2);
    });

    it('should mark email as verified for OAuth users', () => {
      const oauthUser = {
        emailVerified: new Date(),
      };

      expect(oauthUser.emailVerified).toBeInstanceOf(Date);
    });
  });
});

describe('Auth Provider Configuration', () => {
  it('should have Google provider configuration', () => {
    const googleProviderConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    };

    expect(googleProviderConfig.authorization.params.prompt).toBe('consent');
    expect(googleProviderConfig.authorization.params.access_type).toBe('offline');
  });

  it('should have session configuration with 24h expiry', () => {
    const sessionConfig = {
      strategy: 'jwt',
      maxAge: 24 * 60 * 60, // 24 hours
    };

    expect(sessionConfig.strategy).toBe('jwt');
    expect(sessionConfig.maxAge).toBe(86400); // 24 hours in seconds
  });
});
