/**
 * Tests for API keys routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock API keys functions
vi.mock('@/lib/api-keys', () => ({
  createApiKey: vi.fn(),
  listApiKeys: vi.fn(),
  revokeApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
  getApiUsageStats: vi.fn(),
}));

describe('GET /api/api-keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user API keys when authenticated', async () => {
    const { getServerSession } = await import('next-auth');
    const { listApiKeys } = await import('@/lib/api-keys');
    const { GET } = await import('@/app/api/api-keys/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (listApiKeys as any).mockResolvedValue([
      { id: 'key-1', name: 'Test Key', prefix: 'clsf_abcd' },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.keys).toHaveLength(1);
    expect(listApiKeys).toHaveBeenCalledWith('user-1');
  });

  it('returns 401 when not authenticated', async () => {
    const { getServerSession } = await import('next-auth');
    const { GET } = await import('@/app/api/api-keys/route');

    (getServerSession as any).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });
});

describe('POST /api/api-keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates API key with valid data', async () => {
    const { getServerSession } = await import('next-auth');
    const { createApiKey } = await import('@/lib/api-keys');
    const { POST } = await import('@/app/api/api-keys/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (createApiKey as any).mockResolvedValue({
      apiKey: { id: 'key-1', name: 'My Key', prefix: 'clsf_abcd' },
      secretKey: 'clsf_full_key_here',
    });

    const request = new NextRequest('http://localhost/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Key' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.apiKey.name).toBe('My Key');
    expect(data.secretKey).toBe('clsf_full_key_here');
    expect(data.message).toContain('Store this key securely');
  });

  it('rejects invalid request body', async () => {
    const { getServerSession } = await import('next-auth');
    const { POST } = await import('@/app/api/api-keys/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    const request = new NextRequest('http://localhost/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: '' }), // Empty name
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 403 when limit reached', async () => {
    const { getServerSession } = await import('next-auth');
    const { createApiKey } = await import('@/lib/api-keys');
    const { POST } = await import('@/app/api/api-keys/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (createApiKey as any).mockRejectedValue(new Error('Maximum API keys limit reached'));

    const request = new NextRequest('http://localhost/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Key' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/api-keys/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revokes API key', async () => {
    const { getServerSession } = await import('next-auth');
    const { revokeApiKey } = await import('@/lib/api-keys');
    const { DELETE } = await import('@/app/api/api-keys/[id]/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (revokeApiKey as any).mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/api-keys/key-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'key-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('API key revoked');
    expect(revokeApiKey).toHaveBeenCalledWith('user-1', 'key-1');
  });

  it('permanently deletes API key when flag set', async () => {
    const { getServerSession } = await import('next-auth');
    const { deleteApiKey } = await import('@/lib/api-keys');
    const { DELETE } = await import('@/app/api/api-keys/[id]/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (deleteApiKey as any).mockResolvedValue(true);

    const request = new NextRequest(
      'http://localhost/api/api-keys/key-1?permanent=true',
      { method: 'DELETE' }
    );

    const response = await DELETE(request, { params: Promise.resolve({ id: 'key-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('API key deleted');
    expect(deleteApiKey).toHaveBeenCalledWith('user-1', 'key-1');
  });

  it('returns 404 when key not found', async () => {
    const { getServerSession } = await import('next-auth');
    const { revokeApiKey } = await import('@/lib/api-keys');
    const { DELETE } = await import('@/app/api/api-keys/[id]/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (revokeApiKey as any).mockResolvedValue(false);

    const request = new NextRequest('http://localhost/api/api-keys/nonexistent', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(response.status).toBe(404);
  });
});

describe('GET /api/api-keys/[id] (stats)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns API key usage stats', async () => {
    const { getServerSession } = await import('next-auth');
    const { getApiUsageStats } = await import('@/lib/api-keys');
    const { GET } = await import('@/app/api/api-keys/[id]/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (getApiUsageStats as any).mockResolvedValue({
      totalRequests: 100,
      successfulRequests: 95,
      failedRequests: 5,
      avgDuration: 150,
    });

    const request = new NextRequest('http://localhost/api/api-keys/key-1', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ id: 'key-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.totalRequests).toBe(100);
    expect(data.stats.avgDuration).toBe(150);
  });
});
