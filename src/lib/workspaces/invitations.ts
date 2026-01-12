/**
 * Workspace invitation management
 */

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { WorkspaceRole } from '@prisma/client';
import { getUserWorkspaceRole } from './index';

export interface InvitationInfo {
  id: string;
  email: string;
  role: WorkspaceRole;
  workspaceName: string;
  inviterName: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Generate invitation token
 */
function generateInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Create a workspace invitation
 */
export async function createInvitation(
  workspaceId: string,
  email: string,
  role: WorkspaceRole,
  inviterUserId: string
): Promise<{ token: string; invitation: InvitationInfo }> {
  // Check inviter's permission
  const inviterRole = await getUserWorkspaceRole(inviterUserId, workspaceId);
  if (!inviterRole || !['OWNER', 'ADMIN'].includes(inviterRole)) {
    throw new Error('Insufficient permissions to invite');
  }

  // Only owner can invite admins
  if (role === 'ADMIN' && inviterRole !== 'OWNER') {
    throw new Error('Only owner can invite admins');
  }

  // Cannot invite as owner
  if (role === 'OWNER') {
    throw new Error('Cannot invite as owner');
  }

  // Check if user already exists and is a member
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const existingMembership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: { userId: existingUser.id, workspaceId },
      },
    });

    if (existingMembership) {
      throw new Error('User is already a member of this workspace');
    }
  }

  // Check workspace member limit
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  if (workspace._count.members >= workspace.maxMembers) {
    throw new Error('Workspace member limit reached');
  }

  // Check for existing pending invitation
  const existingInvite = await prisma.workspaceInvitation.findUnique({
    where: {
      workspaceId_email: { workspaceId, email },
    },
  });

  if (existingInvite && existingInvite.expiresAt > new Date()) {
    throw new Error('Invitation already pending for this email');
  }

  // Delete expired invitation if exists
  if (existingInvite) {
    await prisma.workspaceInvitation.delete({
      where: { id: existingInvite.id },
    });
  }

  // Get inviter info
  const inviter = await prisma.user.findUnique({
    where: { id: inviterUserId },
    select: { name: true, email: true },
  });

  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const invitation = await prisma.workspaceInvitation.create({
    data: {
      workspaceId,
      email,
      role,
      token,
      invitedBy: inviterUserId,
      expiresAt,
    },
  });

  return {
    token,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      workspaceName: workspace.name,
      inviterName: inviter?.name || inviter?.email || 'Unknown',
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    },
  };
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string): Promise<InvitationInfo | null> {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { name: true } },
    },
  });

  if (!invitation) {
    return null;
  }

  const inviter = await prisma.user.findUnique({
    where: { id: invitation.invitedBy },
    select: { name: true, email: true },
  });

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    workspaceName: invitation.workspace.name,
    inviterName: inviter?.name || inviter?.email || 'Unknown',
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
  };
}

/**
 * Accept a workspace invitation
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ workspaceId: string; role: WorkspaceRole }> {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: true,
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.workspaceInvitation.delete({ where: { id: invitation.id } });
    throw new Error('Invitation has expired');
  }

  // Verify user email matches invitation
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error('Email does not match invitation');
  }

  // Check if already a member
  const existingMembership = await prisma.workspaceMembership.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId: invitation.workspaceId },
    },
  });

  if (existingMembership) {
    await prisma.workspaceInvitation.delete({ where: { id: invitation.id } });
    throw new Error('Already a member of this workspace');
  }

  // Check workspace member limit
  const memberCount = await prisma.workspaceMembership.count({
    where: { workspaceId: invitation.workspaceId },
  });

  if (memberCount >= invitation.workspace.maxMembers) {
    throw new Error('Workspace member limit reached');
  }

  // Create membership and delete invitation
  await prisma.$transaction([
    prisma.workspaceMembership.create({
      data: {
        userId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      },
    }),
    prisma.workspaceInvitation.delete({ where: { id: invitation.id } }),
  ]);

  return {
    workspaceId: invitation.workspaceId,
    role: invitation.role,
  };
}

/**
 * Cancel/revoke an invitation
 */
export async function cancelInvitation(
  invitationId: string,
  actorUserId: string
): Promise<boolean> {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  // Check permission
  const actorRole = await getUserWorkspaceRole(actorUserId, invitation.workspaceId);
  if (!actorRole || !['OWNER', 'ADMIN'].includes(actorRole)) {
    throw new Error('Insufficient permissions');
  }

  await prisma.workspaceInvitation.delete({
    where: { id: invitationId },
  });

  return true;
}

/**
 * List pending invitations for a workspace
 */
export async function listWorkspaceInvitations(workspaceId: string): Promise<InvitationInfo[]> {
  const invitations = await prisma.workspaceInvitation.findMany({
    where: {
      workspaceId,
      expiresAt: { gt: new Date() },
    },
    include: {
      workspace: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const inviterIds = [...new Set(invitations.map((i) => i.invitedBy))];
  const inviters = await prisma.user.findMany({
    where: { id: { in: inviterIds } },
    select: { id: true, name: true, email: true },
  });

  const inviterMap = new Map(inviters.map((u) => [u.id, u]));

  return invitations.map((inv) => {
    const inviter = inviterMap.get(inv.invitedBy);
    return {
      id: inv.id,
      email: inv.email,
      role: inv.role,
      workspaceName: inv.workspace.name,
      inviterName: inviter?.name || inviter?.email || 'Unknown',
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    };
  });
}

/**
 * Resend an invitation (update expiry)
 */
export async function resendInvitation(
  invitationId: string,
  actorUserId: string
): Promise<{ token: string; invitation: InvitationInfo }> {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { id: invitationId },
    include: {
      workspace: { select: { name: true } },
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  // Check permission
  const actorRole = await getUserWorkspaceRole(actorUserId, invitation.workspaceId);
  if (!actorRole || !['OWNER', 'ADMIN'].includes(actorRole)) {
    throw new Error('Insufficient permissions');
  }

  const newToken = generateInviteToken();
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  const updated = await prisma.workspaceInvitation.update({
    where: { id: invitationId },
    data: {
      token: newToken,
      expiresAt: newExpiresAt,
    },
  });

  const inviter = await prisma.user.findUnique({
    where: { id: invitation.invitedBy },
    select: { name: true, email: true },
  });

  return {
    token: newToken,
    invitation: {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      workspaceName: invitation.workspace.name,
      inviterName: inviter?.name || inviter?.email || 'Unknown',
      expiresAt: updated.expiresAt,
      createdAt: updated.createdAt,
    },
  };
}
