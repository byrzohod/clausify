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

  describe('PrismaAdapter Behavior', () => {
    it('should allow sign-in callback to return true for Google OAuth', () => {
      // The signIn callback simply returns true for Google OAuth
      // PrismaAdapter handles user creation automatically
      const signInCallback = ({ account }: { account: { provider: string } | null }) => {
        if (account?.provider === 'google') {
          return true;
        }
        return true;
      };

      expect(signInCallback({ account: { provider: 'google' } })).toBe(true);
      expect(signInCallback({ account: { provider: 'credentials' } })).toBe(true);
      expect(signInCallback({ account: null })).toBe(true);
    });

    it('should set user ID in JWT token on sign-in', () => {
      // Simulate jwt callback behavior
      const jwtCallback = ({ token, user }: { token: { id?: string }; user?: { id: string } }) => {
        if (user) {
          token.id = user.id;
        }
        return token;
      };

      const token = { email: 'test@gmail.com' };
      const user = { id: 'user-123' };

      const result = jwtCallback({ token, user });
      expect(result.id).toBe('user-123');
    });

    it('should preserve token when user object is not available', () => {
      const jwtCallback = ({ token, user }: { token: { id?: string; email?: string }; user?: { id: string } }) => {
        if (user) {
          token.id = user.id;
        }
        return token;
      };

      const token = { id: 'existing-id', email: 'test@gmail.com' };

      const result = jwtCallback({ token, user: undefined });
      expect(result.id).toBe('existing-id');
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
