import { getServerSession } from 'next-auth';
import { authOptions } from './options';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { UserProfile } from '@/types';

export { authOptions };

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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

  return user;
}

export async function createUser(
  email: string,
  password: string,
  name?: string
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function canUserAnalyze(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      analysesUsed: true,
      analysesLimit: true,
      subscriptionEnd: true,
    },
  });

  if (!user) return false;

  // Check if subscription is still valid for paid plans
  if (user.plan !== 'FREE' && user.subscriptionEnd) {
    if (new Date(user.subscriptionEnd) < new Date()) {
      return false;
    }
  }

  return user.analysesUsed < user.analysesLimit;
}

export async function incrementAnalysisCount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      analysesUsed: {
        increment: 1,
      },
    },
  });
}

export async function getRemainingAnalyses(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      analysesUsed: true,
      analysesLimit: true,
    },
  });

  if (!user) return 0;
  return Math.max(0, user.analysesLimit - user.analysesUsed);
}
