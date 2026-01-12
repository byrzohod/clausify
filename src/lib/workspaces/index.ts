/**
 * Workspace management for team collaboration
 */

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { WorkspaceRole, WorkspacePlan } from '@prisma/client';

export interface CreateWorkspaceOptions {
  name: string;
  ownerId: string;
  plan?: WorkspacePlan;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  maxMembers: number;
  analysesLimit: number;
  analysesUsed: number;
  memberCount: number;
  createdAt: Date;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date;
}

/**
 * Generate a unique workspace slug
 */
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  const suffix = randomBytes(4).toString('hex');
  return `${baseSlug}-${suffix}`;
}

/**
 * Get workspace plan limits
 */
export function getPlanLimits(plan: WorkspacePlan): {
  maxMembers: number;
  analysesLimit: number;
} {
  switch (plan) {
    case 'TEAM_MONTHLY':
    case 'TEAM_YEARLY':
      return { maxMembers: 5, analysesLimit: 100 };
    case 'BUSINESS_MONTHLY':
    case 'BUSINESS_YEARLY':
      return { maxMembers: 20, analysesLimit: 500 };
    case 'ENTERPRISE':
      return { maxMembers: 100, analysesLimit: 2000 };
    default:
      return { maxMembers: 5, analysesLimit: 100 };
  }
}

/**
 * Create a new workspace
 */
export async function createWorkspace(options: CreateWorkspaceOptions): Promise<WorkspaceInfo> {
  const { name, ownerId, plan = 'TEAM_MONTHLY' } = options;

  // Verify owner exists
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
  });

  if (!owner) {
    throw new Error('Owner not found');
  }

  // Check if user already owns a workspace (limit of 3)
  const ownedWorkspaces = await prisma.workspaceMembership.count({
    where: { userId: ownerId, role: 'OWNER' },
  });

  if (ownedWorkspaces >= 3) {
    throw new Error('Maximum workspace ownership limit reached (3)');
  }

  const slug = generateSlug(name);
  const limits = getPlanLimits(plan);

  // Create workspace and add owner as member
  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      plan,
      maxMembers: limits.maxMembers,
      analysesLimit: limits.analysesLimit,
      members: {
        create: {
          userId: ownerId,
          role: 'OWNER',
        },
      },
    },
    include: {
      _count: { select: { members: true } },
    },
  });

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan,
    maxMembers: workspace.maxMembers,
    analysesLimit: workspace.analysesLimit,
    analysesUsed: workspace.analysesUsed,
    memberCount: workspace._count.members,
    createdAt: workspace.createdAt,
  };
}

/**
 * Get workspace by ID
 */
export async function getWorkspace(workspaceId: string): Promise<WorkspaceInfo | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!workspace) {
    return null;
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan,
    maxMembers: workspace.maxMembers,
    analysesLimit: workspace.analysesLimit,
    analysesUsed: workspace.analysesUsed,
    memberCount: workspace._count.members,
    createdAt: workspace.createdAt,
  };
}

/**
 * Get workspace by slug
 */
export async function getWorkspaceBySlug(slug: string): Promise<WorkspaceInfo | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!workspace) {
    return null;
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan,
    maxMembers: workspace.maxMembers,
    analysesLimit: workspace.analysesLimit,
    analysesUsed: workspace.analysesUsed,
    memberCount: workspace._count.members,
    createdAt: workspace.createdAt,
  };
}

/**
 * List workspaces for a user
 */
export async function listUserWorkspaces(userId: string): Promise<
  Array<
    WorkspaceInfo & {
      role: WorkspaceRole;
    }
  >
> {
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    plan: m.workspace.plan,
    maxMembers: m.workspace.maxMembers,
    analysesLimit: m.workspace.analysesLimit,
    analysesUsed: m.workspace.analysesUsed,
    memberCount: m.workspace._count.members,
    createdAt: m.workspace.createdAt,
    role: m.role,
  }));
}

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const memberships = await prisma.workspaceMembership.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return memberships.map((m) => ({
    id: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

/**
 * Get user's role in a workspace
 */
export async function getUserWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const membership = await prisma.workspaceMembership.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
  });

  return membership?.role ?? null;
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  newRole: WorkspaceRole,
  actorUserId: string
): Promise<boolean> {
  // Check actor's permission
  const actorRole = await getUserWorkspaceRole(actorUserId, workspaceId);
  if (!actorRole || !['OWNER', 'ADMIN'].includes(actorRole)) {
    throw new Error('Insufficient permissions');
  }

  // Cannot change owner role
  const targetMembership = await prisma.workspaceMembership.findUnique({
    where: {
      userId_workspaceId: { userId: targetUserId, workspaceId },
    },
  });

  if (!targetMembership) {
    throw new Error('Member not found');
  }

  if (targetMembership.role === 'OWNER') {
    throw new Error('Cannot change owner role');
  }

  // Only owner can promote to admin
  if (newRole === 'ADMIN' && actorRole !== 'OWNER') {
    throw new Error('Only owner can promote to admin');
  }

  await prisma.workspaceMembership.update({
    where: { id: targetMembership.id },
    data: { role: newRole },
  });

  return true;
}

/**
 * Remove a member from workspace
 */
export async function removeMember(
  workspaceId: string,
  targetUserId: string,
  actorUserId: string
): Promise<boolean> {
  // Check actor's permission
  const actorRole = await getUserWorkspaceRole(actorUserId, workspaceId);
  if (!actorRole || !['OWNER', 'ADMIN'].includes(actorRole)) {
    throw new Error('Insufficient permissions');
  }

  const targetMembership = await prisma.workspaceMembership.findUnique({
    where: {
      userId_workspaceId: { userId: targetUserId, workspaceId },
    },
  });

  if (!targetMembership) {
    throw new Error('Member not found');
  }

  // Cannot remove owner
  if (targetMembership.role === 'OWNER') {
    throw new Error('Cannot remove workspace owner');
  }

  // Admins cannot remove other admins
  if (targetMembership.role === 'ADMIN' && actorRole !== 'OWNER') {
    throw new Error('Only owner can remove admins');
  }

  await prisma.workspaceMembership.delete({
    where: { id: targetMembership.id },
  });

  return true;
}

/**
 * Delete workspace (owner only)
 */
export async function deleteWorkspace(workspaceId: string, ownerId: string): Promise<boolean> {
  const role = await getUserWorkspaceRole(ownerId, workspaceId);
  if (role !== 'OWNER') {
    throw new Error('Only owner can delete workspace');
  }

  await prisma.workspace.delete({
    where: { id: workspaceId },
  });

  return true;
}

/**
 * Update workspace settings
 */
export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  updates: { name?: string }
): Promise<WorkspaceInfo> {
  const role = await getUserWorkspaceRole(userId, workspaceId);
  if (!role || !['OWNER', 'ADMIN'].includes(role)) {
    throw new Error('Insufficient permissions');
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: updates,
    include: {
      _count: { select: { members: true } },
    },
  });

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan,
    maxMembers: workspace.maxMembers,
    analysesLimit: workspace.analysesLimit,
    analysesUsed: workspace.analysesUsed,
    memberCount: workspace._count.members,
    createdAt: workspace.createdAt,
  };
}

/**
 * Increment workspace analysis count
 */
export async function incrementWorkspaceAnalyses(workspaceId: string): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return false;
  }

  if (workspace.analysesUsed >= workspace.analysesLimit) {
    throw new Error('Workspace analysis limit reached');
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { analysesUsed: { increment: 1 } },
  });

  return true;
}
