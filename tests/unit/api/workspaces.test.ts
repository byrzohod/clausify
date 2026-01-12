/**
 * Tests for workspaces routes
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

// Mock workspace functions
vi.mock('@/lib/workspaces', () => ({
  createWorkspace: vi.fn(),
  listUserWorkspaces: vi.fn(),
  getWorkspace: vi.fn(),
  getUserWorkspaceRole: vi.fn(),
  updateWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  getWorkspaceMembers: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
}));

vi.mock('@/lib/workspaces/invitations', () => ({
  createInvitation: vi.fn(),
  listWorkspaceInvitations: vi.fn(),
  cancelInvitation: vi.fn(),
  resendInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
  getInvitationByToken: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendWorkspaceInviteEmail: vi.fn(),
}));

describe('GET /api/workspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user workspaces when authenticated', async () => {
    const { getServerSession } = await import('next-auth');
    const { listUserWorkspaces } = await import('@/lib/workspaces');
    const { GET } = await import('@/app/api/workspaces/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (listUserWorkspaces as any).mockResolvedValue([
      { id: 'ws-1', name: 'My Workspace', role: 'OWNER' },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.workspaces).toHaveLength(1);
    expect(data.workspaces[0].name).toBe('My Workspace');
  });

  it('returns 401 when not authenticated', async () => {
    const { getServerSession } = await import('next-auth');
    const { GET } = await import('@/app/api/workspaces/route');

    (getServerSession as any).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });
});

describe('POST /api/workspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates workspace with valid data', async () => {
    const { getServerSession } = await import('next-auth');
    const { createWorkspace } = await import('@/lib/workspaces');
    const { POST } = await import('@/app/api/workspaces/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (createWorkspace as any).mockResolvedValue({
      id: 'ws-1',
      name: 'New Workspace',
      slug: 'new-workspace',
      memberCount: 1,
    });

    const request = new NextRequest('http://localhost/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Workspace' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.workspace.name).toBe('New Workspace');
    expect(createWorkspace).toHaveBeenCalledWith({
      name: 'New Workspace',
      ownerId: 'user-1',
    });
  });

  it('rejects invalid request body', async () => {
    const { getServerSession } = await import('next-auth');
    const { POST } = await import('@/app/api/workspaces/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    const request = new NextRequest('http://localhost/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 403 when ownership limit reached', async () => {
    const { getServerSession } = await import('next-auth');
    const { createWorkspace } = await import('@/lib/workspaces');
    const { POST } = await import('@/app/api/workspaces/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (createWorkspace as any).mockRejectedValue(
      new Error('Maximum workspace ownership limit reached')
    );

    const request = new NextRequest('http://localhost/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Workspace' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });
});

describe('GET /api/workspaces/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns workspace details for member', async () => {
    const { getServerSession } = await import('next-auth');
    const { getWorkspace, getUserWorkspaceRole } = await import('@/lib/workspaces');
    const { GET } = await import('@/app/api/workspaces/[id]/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (getUserWorkspaceRole as any).mockResolvedValue('ADMIN');
    (getWorkspace as any).mockResolvedValue({
      id: 'ws-1',
      name: 'My Workspace',
    });

    const request = new NextRequest('http://localhost/api/workspaces/ws-1');
    const response = await GET(request, { params: Promise.resolve({ id: 'ws-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.workspace.name).toBe('My Workspace');
    expect(data.role).toBe('ADMIN');
  });

  it('returns 404 for non-member', async () => {
    const { getServerSession } = await import('next-auth');
    const { getUserWorkspaceRole } = await import('@/lib/workspaces');
    const { GET } = await import('@/app/api/workspaces/[id]/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (getUserWorkspaceRole as any).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/workspaces/ws-1');
    const response = await GET(request, { params: Promise.resolve({ id: 'ws-1' }) });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/workspaces/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes workspace when owner', async () => {
    const { getServerSession } = await import('next-auth');
    const { deleteWorkspace } = await import('@/lib/workspaces');
    const { DELETE } = await import('@/app/api/workspaces/[id]/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (deleteWorkspace as any).mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/workspaces/ws-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'ws-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Workspace deleted');
  });

  it('returns 403 when not owner', async () => {
    const { getServerSession } = await import('next-auth');
    const { deleteWorkspace } = await import('@/lib/workspaces');
    const { DELETE } = await import('@/app/api/workspaces/[id]/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (deleteWorkspace as any).mockRejectedValue(new Error('Only owner can delete workspace'));

    const request = new NextRequest('http://localhost/api/workspaces/ws-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'ws-1' }) });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/workspaces/[id]/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns members list for workspace member', async () => {
    const { getServerSession } = await import('next-auth');
    const { getUserWorkspaceRole, getWorkspaceMembers } = await import('@/lib/workspaces');
    const { GET } = await import('@/app/api/workspaces/[id]/members/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (getUserWorkspaceRole as any).mockResolvedValue('MEMBER');
    (getWorkspaceMembers as any).mockResolvedValue([
      { userId: 'user-1', name: 'John', role: 'OWNER' },
      { userId: 'user-2', name: 'Jane', role: 'MEMBER' },
    ]);

    const request = new NextRequest('http://localhost/api/workspaces/ws-1/members');
    const response = await GET(request, { params: Promise.resolve({ id: 'ws-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.members).toHaveLength(2);
  });
});

describe('POST /api/workspaces/[id]/invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates invitation for admin', async () => {
    const { getServerSession } = await import('next-auth');
    const { getUserWorkspaceRole } = await import('@/lib/workspaces');
    const { createInvitation } = await import('@/lib/workspaces/invitations');
    const { sendWorkspaceInviteEmail } = await import('@/lib/email');
    const { POST } = await import('@/app/api/workspaces/[id]/invitations/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (getUserWorkspaceRole as any).mockResolvedValue('ADMIN');
    (createInvitation as any).mockResolvedValue({
      token: 'invite_token',
      invitation: {
        id: 'inv-1',
        email: 'new@test.com',
        role: 'MEMBER',
        workspaceName: 'My Workspace',
        inviterName: 'John',
      },
    });
    (sendWorkspaceInviteEmail as any).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/workspaces/ws-1/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@test.com', role: 'MEMBER' }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'ws-1' }) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.invitation.email).toBe('new@test.com');
    expect(sendWorkspaceInviteEmail).toHaveBeenCalled();
  });

  it('returns 403 for non-admin', async () => {
    const { getServerSession } = await import('next-auth');
    const { getUserWorkspaceRole } = await import('@/lib/workspaces');
    const { GET } = await import('@/app/api/workspaces/[id]/invitations/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (getUserWorkspaceRole as any).mockResolvedValue('MEMBER');

    const request = new NextRequest('http://localhost/api/workspaces/ws-1/invitations');
    const response = await GET(request, { params: Promise.resolve({ id: 'ws-1' }) });

    expect(response.status).toBe(403);
  });
});

describe('POST /api/invitations/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts invitation', async () => {
    const { getServerSession } = await import('next-auth');
    const { acceptInvitation } = await import('@/lib/workspaces/invitations');
    const { POST } = await import('@/app/api/invitations/accept/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (acceptInvitation as any).mockResolvedValue({
      workspaceId: 'ws-1',
      role: 'MEMBER',
    });

    const request = new NextRequest('http://localhost/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid_token' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.workspaceId).toBe('ws-1');
    expect(data.role).toBe('MEMBER');
  });

  it('returns 404 for expired token', async () => {
    const { getServerSession } = await import('next-auth');
    const { acceptInvitation } = await import('@/lib/workspaces/invitations');
    const { POST } = await import('@/app/api/invitations/accept/route');

    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    (acceptInvitation as any).mockRejectedValue(new Error('Invitation has expired'));

    const request = new NextRequest('http://localhost/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: 'expired_token' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
  });
});
