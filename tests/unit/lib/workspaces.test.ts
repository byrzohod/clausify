/**
 * Tests for workspace management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    workspace: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMembership: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma);

describe('Workspace Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlanLimits', () => {
    it('returns correct limits for TEAM_MONTHLY', async () => {
      const { getPlanLimits } = await import('@/lib/workspaces');
      const limits = getPlanLimits('TEAM_MONTHLY');

      expect(limits.maxMembers).toBe(5);
      expect(limits.analysesLimit).toBe(100);
    });

    it('returns correct limits for BUSINESS_MONTHLY', async () => {
      const { getPlanLimits } = await import('@/lib/workspaces');
      const limits = getPlanLimits('BUSINESS_MONTHLY');

      expect(limits.maxMembers).toBe(20);
      expect(limits.analysesLimit).toBe(500);
    });

    it('returns correct limits for ENTERPRISE', async () => {
      const { getPlanLimits } = await import('@/lib/workspaces');
      const limits = getPlanLimits('ENTERPRISE');

      expect(limits.maxMembers).toBe(100);
      expect(limits.analysesLimit).toBe(2000);
    });
  });

  describe('createWorkspace', () => {
    it('creates workspace with owner membership', async () => {
      const { createWorkspace } = await import('@/lib/workspaces');

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@test.com' } as any);
      mockPrisma.workspaceMembership.count.mockResolvedValue(0);
      mockPrisma.workspace.create.mockResolvedValue({
        id: 'ws-1',
        name: 'My Team',
        slug: 'my-team-abc123',
        plan: 'TEAM_MONTHLY',
        maxMembers: 5,
        analysesLimit: 100,
        analysesUsed: 0,
        createdAt: new Date(),
        _count: { members: 1 },
      } as any);

      const workspace = await createWorkspace({
        name: 'My Team',
        ownerId: 'user-1',
      });

      expect(workspace.name).toBe('My Team');
      expect(workspace.memberCount).toBe(1);
      expect(mockPrisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'My Team',
            members: { create: { userId: 'user-1', role: 'OWNER' } },
          }),
        })
      );
    });

    it('rejects when owner not found', async () => {
      const { createWorkspace } = await import('@/lib/workspaces');

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        createWorkspace({ name: 'Test', ownerId: 'nonexistent' })
      ).rejects.toThrow('Owner not found');
    });

    it('rejects when ownership limit reached', async () => {
      const { createWorkspace } = await import('@/lib/workspaces');

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' } as any);
      mockPrisma.workspaceMembership.count.mockResolvedValue(3);

      await expect(
        createWorkspace({ name: 'Test', ownerId: 'user-1' })
      ).rejects.toThrow('Maximum workspace ownership limit reached');
    });
  });

  describe('getWorkspace', () => {
    it('returns workspace info', async () => {
      const { getWorkspace } = await import('@/lib/workspaces');

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        name: 'My Team',
        slug: 'my-team',
        plan: 'TEAM_MONTHLY',
        maxMembers: 5,
        analysesLimit: 100,
        analysesUsed: 10,
        createdAt: new Date(),
        _count: { members: 3 },
      } as any);

      const workspace = await getWorkspace('ws-1');

      expect(workspace).not.toBeNull();
      expect(workspace?.name).toBe('My Team');
      expect(workspace?.memberCount).toBe(3);
    });

    it('returns null for non-existent workspace', async () => {
      const { getWorkspace } = await import('@/lib/workspaces');

      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      const workspace = await getWorkspace('nonexistent');

      expect(workspace).toBeNull();
    });
  });

  describe('listUserWorkspaces', () => {
    it('returns workspaces with roles', async () => {
      const { listUserWorkspaces } = await import('@/lib/workspaces');

      mockPrisma.workspaceMembership.findMany.mockResolvedValue([
        {
          role: 'OWNER',
          workspace: {
            id: 'ws-1',
            name: 'My Workspace',
            slug: 'my-workspace',
            plan: 'TEAM_MONTHLY',
            maxMembers: 5,
            analysesLimit: 100,
            analysesUsed: 0,
            createdAt: new Date(),
            _count: { members: 1 },
          },
        },
        {
          role: 'MEMBER',
          workspace: {
            id: 'ws-2',
            name: 'Other Workspace',
            slug: 'other-workspace',
            plan: 'BUSINESS_MONTHLY',
            maxMembers: 20,
            analysesLimit: 500,
            analysesUsed: 50,
            createdAt: new Date(),
            _count: { members: 5 },
          },
        },
      ] as any);

      const workspaces = await listUserWorkspaces('user-1');

      expect(workspaces).toHaveLength(2);
      expect(workspaces[0].role).toBe('OWNER');
      expect(workspaces[1].role).toBe('MEMBER');
    });
  });

  describe('getWorkspaceMembers', () => {
    it('returns formatted member list', async () => {
      const { getWorkspaceMembers } = await import('@/lib/workspaces');

      mockPrisma.workspaceMembership.findMany.mockResolvedValue([
        {
          id: 'mem-1',
          role: 'OWNER',
          joinedAt: new Date(),
          user: { id: 'user-1', name: 'John', email: 'john@test.com' },
        },
        {
          id: 'mem-2',
          role: 'MEMBER',
          joinedAt: new Date(),
          user: { id: 'user-2', name: 'Jane', email: 'jane@test.com' },
        },
      ] as any);

      const members = await getWorkspaceMembers('ws-1');

      expect(members).toHaveLength(2);
      expect(members[0].name).toBe('John');
      expect(members[0].role).toBe('OWNER');
      expect(members[1].name).toBe('Jane');
      expect(members[1].role).toBe('MEMBER');
    });
  });

  describe('getUserWorkspaceRole', () => {
    it('returns user role', async () => {
      const { getUserWorkspaceRole } = await import('@/lib/workspaces');

      mockPrisma.workspaceMembership.findUnique.mockResolvedValue({
        role: 'ADMIN',
      } as any);

      const role = await getUserWorkspaceRole('user-1', 'ws-1');

      expect(role).toBe('ADMIN');
    });

    it('returns null for non-member', async () => {
      const { getUserWorkspaceRole } = await import('@/lib/workspaces');

      mockPrisma.workspaceMembership.findUnique.mockResolvedValue(null);

      const role = await getUserWorkspaceRole('user-1', 'ws-1');

      expect(role).toBeNull();
    });
  });

  describe('updateMemberRole', () => {
    it('updates member role', async () => {
      const { updateMemberRole } = await import('@/lib/workspaces');

      // Actor is OWNER
      mockPrisma.workspaceMembership.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' } as any) // Actor role check
        .mockResolvedValueOnce({ id: 'mem-1', role: 'MEMBER' } as any); // Target membership

      mockPrisma.workspaceMembership.update.mockResolvedValue({} as any);

      const result = await updateMemberRole('ws-1', 'user-2', 'ADMIN', 'user-1');

      expect(result).toBe(true);
      expect(mockPrisma.workspaceMembership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { role: 'ADMIN' },
        })
      );
    });

    it('rejects when actor has insufficient permissions', async () => {
      const { updateMemberRole } = await import('@/lib/workspaces');

      // Actor is MEMBER
      mockPrisma.workspaceMembership.findUnique.mockResolvedValue({ role: 'MEMBER' } as any);

      await expect(
        updateMemberRole('ws-1', 'user-2', 'ADMIN', 'user-1')
      ).rejects.toThrow('Insufficient permissions');
    });

    it('rejects changing owner role', async () => {
      const { updateMemberRole } = await import('@/lib/workspaces');

      mockPrisma.workspaceMembership.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' } as any) // Actor role
        .mockResolvedValueOnce({ id: 'mem-1', role: 'OWNER' } as any); // Target is OWNER

      await expect(
        updateMemberRole('ws-1', 'user-2', 'ADMIN', 'user-1')
      ).rejects.toThrow('Cannot change owner role');
    });

    it('only owner can promote to admin', async () => {
      const { updateMemberRole } = await import('@/lib/workspaces');

      // Actor is ADMIN (not OWNER)
      mockPrisma.workspaceMembership.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' } as any)
        .mockResolvedValueOnce({ id: 'mem-1', role: 'MEMBER' } as any);

      await expect(
        updateMemberRole('ws-1', 'user-2', 'ADMIN', 'user-1')
      ).rejects.toThrow('Only owner can promote to admin');
    });
  });

  describe('removeMember', () => {
    it('removes member from workspace', async () => {
      const { removeMember } = await import('@/lib/workspaces');

      mockPrisma.workspaceMembership.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' } as any) // Actor role
        .mockResolvedValueOnce({ id: 'mem-1', role: 'MEMBER' } as any); // Target

      mockPrisma.workspaceMembership.delete.mockResolvedValue({} as any);

      const result = await removeMember('ws-1', 'user-2', 'user-1');

      expect(result).toBe(true);
    });

    it('rejects removing owner', async () => {
      const { removeMember } = await import('@/lib/workspaces');

      mockPrisma.workspaceMembership.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' } as any)
        .mockResolvedValueOnce({ id: 'mem-1', role: 'OWNER' } as any);

      await expect(
        removeMember('ws-1', 'user-2', 'user-1')
      ).rejects.toThrow('Cannot remove workspace owner');
    });
  });

  describe('deleteWorkspace', () => {
    it('deletes workspace when owner', async () => {
      const { deleteWorkspace } = await import('@/lib/workspaces');

      mockPrisma.workspaceMembership.findUnique.mockResolvedValue({ role: 'OWNER' } as any);
      mockPrisma.workspace.delete.mockResolvedValue({} as any);

      const result = await deleteWorkspace('ws-1', 'user-1');

      expect(result).toBe(true);
      expect(mockPrisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
      });
    });

    it('rejects when not owner', async () => {
      const { deleteWorkspace } = await import('@/lib/workspaces');

      mockPrisma.workspaceMembership.findUnique.mockResolvedValue({ role: 'ADMIN' } as any);

      await expect(
        deleteWorkspace('ws-1', 'user-1')
      ).rejects.toThrow('Only owner can delete workspace');
    });
  });

  describe('incrementWorkspaceAnalyses', () => {
    it('increments analysis count', async () => {
      const { incrementWorkspaceAnalyses } = await import('@/lib/workspaces');

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        analysesUsed: 50,
        analysesLimit: 100,
      } as any);
      mockPrisma.workspace.update.mockResolvedValue({} as any);

      const result = await incrementWorkspaceAnalyses('ws-1');

      expect(result).toBe(true);
      expect(mockPrisma.workspace.update).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
        data: { analysesUsed: { increment: 1 } },
      });
    });

    it('rejects when limit reached', async () => {
      const { incrementWorkspaceAnalyses } = await import('@/lib/workspaces');

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        analysesUsed: 100,
        analysesLimit: 100,
      } as any);

      await expect(
        incrementWorkspaceAnalyses('ws-1')
      ).rejects.toThrow('Workspace analysis limit reached');
    });
  });
});
