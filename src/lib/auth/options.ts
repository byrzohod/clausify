import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Development-only logging helper to prevent sensitive data exposure in production
const isDev = process.env.NODE_ENV === 'development';
const authLog = (message: string, data?: object) => {
  if (isDev) {
    console.log(`[AUTH] ${message}`, data ?? '');
  }
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      // SECURITY NOTE: allowDangerousEmailAccountLinking is enabled to allow users
      // who signed up with email/password to later link their Google account.
      // Risk: If an attacker controls a Google account with the victim's email,
      // they could gain access. Mitigation: Google verifies email ownership.
      // TODO: Consider requiring email verification before account linking.
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    // Email/Password Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (more secure than default 30 days)
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: isDev || process.env.NEXTAUTH_DEBUG === 'true',
  callbacks: {
    async signIn({ user, account }) {
      // PrismaAdapter handles user/account creation automatically
      if (account?.provider === 'google') {
        authLog('Google OAuth sign-in', { email: user.email });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      authLog('JWT callback', {
        hasUser: !!user,
        hasAccount: !!account,
        provider: account?.provider,
      });
      // user object is available on initial sign-in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      authLog('Session callback', { hasToken: !!token.id });
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      authLog('User signed in', {
        provider: account?.provider || 'credentials',
      });
    },
    async signOut() {
      authLog('User signed out');
    },
    async createUser({ user }) {
      authLog('User created', { email: user.email });
    },
    async linkAccount({ account }) {
      authLog('Account linked', { provider: account.provider });
    },
  },
  logger: {
    error(code, ...message) {
      // Always log errors in production for debugging
      console.error('[AUTH ERROR]', code, ...message);
    },
    warn(code, ...message) {
      if (isDev) {
        console.warn('[AUTH WARN]', code, ...message);
      }
    },
    debug(code, ...message) {
      if (isDev) {
        console.log('[AUTH DEBUG]', code, ...message);
      }
    },
  },
};
