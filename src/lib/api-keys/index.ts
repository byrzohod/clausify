/**
 * API Key management for public API access
 */

import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

const API_KEY_PREFIX = 'clsf_';
const API_KEY_LENGTH = 32;

export interface CreateApiKeyOptions {
  userId: string;
  name: string;
  expiresAt?: Date;
  rateLimit?: number;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  lastUsed: Date | null;
  expiresAt: Date | null;
  rateLimit: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ValidateResult {
  valid: boolean;
  apiKey?: {
    id: string;
    userId: string;
    name: string;
    rateLimit: number;
  };
  error?: string;
}

/**
 * Generate a new API key
 * Returns the full key (only shown once) and the hashed version for storage
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomPart = randomBytes(API_KEY_LENGTH).toString('base64url');
  const key = `${API_KEY_PREFIX}${randomPart}`;
  const hash = hashApiKey(key);
  const prefix = key.substring(0, 12);

  return { key, hash, prefix };
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(options: CreateApiKeyOptions): Promise<{
  apiKey: ApiKeyInfo;
  secretKey: string;
}> {
  const { userId, name, expiresAt, rateLimit = 100 } = options;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check API key limit (max 5 per user)
  const existingKeys = await prisma.apiKey.count({
    where: { userId, isActive: true },
  });

  if (existingKeys >= 5) {
    throw new Error('Maximum API keys limit reached (5)');
  }

  // Generate the key
  const { key, hash, prefix } = generateApiKey();

  // Store in database
  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      key: hash,
      prefix,
      expiresAt,
      rateLimit,
    },
  });

  return {
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      lastUsed: apiKey.lastUsed,
      expiresAt: apiKey.expiresAt,
      rateLimit: apiKey.rateLimit,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
    },
    secretKey: key,
  };
}

/**
 * Validate an API key and return associated user info
 */
export async function validateApiKey(key: string): Promise<ValidateResult> {
  // Check format
  if (!key.startsWith(API_KEY_PREFIX)) {
    return { valid: false, error: 'Invalid API key format' };
  }

  const hash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hash },
    include: { user: true },
  });

  if (!apiKey) {
    return { valid: false, error: 'API key not found' };
  }

  if (!apiKey.isActive) {
    return { valid: false, error: 'API key is inactive' };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsed: new Date() },
  });

  return {
    valid: true,
    apiKey: {
      id: apiKey.id,
      userId: apiKey.userId,
      name: apiKey.name,
      rateLimit: apiKey.rateLimit,
    },
  };
}

/**
 * List all API keys for a user
 */
export async function listApiKeys(userId: string): Promise<ApiKeyInfo[]> {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    lastUsed: key.lastUsed,
    expiresAt: key.expiresAt,
    rateLimit: key.rateLimit,
    isActive: key.isActive,
    createdAt: key.createdAt,
  }));
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  const apiKey = await prisma.apiKey.findFirst({
    where: { id: keyId, userId },
  });

  if (!apiKey) {
    return false;
  }

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { isActive: false },
  });

  return true;
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(userId: string, keyId: string): Promise<boolean> {
  const apiKey = await prisma.apiKey.findFirst({
    where: { id: keyId, userId },
  });

  if (!apiKey) {
    return false;
  }

  await prisma.apiKey.delete({
    where: { id: keyId },
  });

  return true;
}

/**
 * Record API usage for analytics
 */
export async function recordApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  status: number,
  duration: number
): Promise<void> {
  await prisma.apiUsage.create({
    data: {
      apiKeyId,
      endpoint,
      method,
      status,
      duration,
    },
  });
}

/**
 * Get API usage statistics for a key
 */
export async function getApiUsageStats(
  apiKeyId: string,
  days: number = 30
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgDuration: number;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const usage = await prisma.apiUsage.findMany({
    where: {
      apiKeyId,
      timestamp: { gte: since },
    },
  });

  const totalRequests = usage.length;
  const successfulRequests = usage.filter((u) => u.status >= 200 && u.status < 400).length;
  const failedRequests = usage.filter((u) => u.status >= 400).length;
  const avgDuration =
    totalRequests > 0 ? usage.reduce((sum, u) => sum + u.duration, 0) / totalRequests : 0;

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    avgDuration: Math.round(avgDuration),
  };
}
