/**
 * Email notification service
 */

import { prisma } from '@/lib/prisma';
import {
  sendEmail,
  generateWelcomeEmail,
  generateAnalysisCompleteEmail,
  generateExpirationAlertEmail,
  generatePasswordResetEmail,
  generateWorkspaceInviteEmail,
} from './client';

/**
 * Check if user has email notifications enabled for a specific type
 */
async function shouldSendEmail(
  userId: string,
  type: 'analysisComplete' | 'expirationAlerts' | 'marketingEmails' | 'weeklyDigest'
): Promise<boolean> {
  const prefs = await prisma.emailPreferences.findUnique({
    where: { userId },
  });

  // Default to true for transactional emails if no preferences set
  if (!prefs) {
    return type === 'analysisComplete' || type === 'expirationAlerts';
  }

  return prefs[type];
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userId: string, email: string, name: string) {
  try {
    const { subject, html } = generateWelcomeEmail(name || 'there');
    await sendEmail({ to: email, subject, html });
    console.log('[Email] Welcome email sent to:', email);
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
  }
}

/**
 * Send analysis complete notification
 */
export async function sendAnalysisCompleteEmail(
  userId: string,
  email: string,
  fileName: string,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  redFlagsCount: number,
  contractId: string
) {
  // Check user preferences
  const shouldSend = await shouldSendEmail(userId, 'analysisComplete');
  if (!shouldSend) {
    console.log('[Email] Analysis complete email disabled for user:', userId);
    return;
  }

  try {
    const contractUrl = `https://clausify.app/contracts/${contractId}`;
    const { subject, html } = generateAnalysisCompleteEmail(
      fileName,
      riskLevel,
      redFlagsCount,
      contractUrl
    );
    await sendEmail({ to: email, subject, html });
    console.log('[Email] Analysis complete email sent to:', email);
  } catch (error) {
    console.error('[Email] Failed to send analysis complete email:', error);
  }
}

/**
 * Send contract expiration alert
 */
export async function sendExpirationAlertEmail(
  userId: string,
  email: string,
  contractName: string,
  expirationDate: Date,
  contractId: string
) {
  // Check user preferences
  const shouldSend = await shouldSendEmail(userId, 'expirationAlerts');
  if (!shouldSend) {
    console.log('[Email] Expiration alert email disabled for user:', userId);
    return;
  }

  try {
    const daysUntil = Math.ceil(
      (expirationDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    const contractUrl = `https://clausify.app/contracts/${contractId}`;
    const { subject, html } = generateExpirationAlertEmail(
      contractName,
      expirationDate.toLocaleDateString(),
      daysUntil,
      contractUrl
    );
    await sendEmail({ to: email, subject, html });
    console.log('[Email] Expiration alert email sent to:', email);
  } catch (error) {
    console.error('[Email] Failed to send expiration alert email:', error);
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const resetUrl = `https://clausify.app/auth/reset-password?token=${token}`;
    const { subject, html } = generatePasswordResetEmail(resetUrl);
    await sendEmail({ to: email, subject, html });
    console.log('[Email] Password reset email sent to:', email);
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
  }
}

/**
 * Send workspace invitation email
 */
export async function sendWorkspaceInviteEmail(
  email: string,
  workspaceName: string,
  inviterName: string,
  token: string,
  role: string
) {
  try {
    const inviteUrl = `https://clausify.app/invite/${token}`;
    const { subject, html } = generateWorkspaceInviteEmail(
      workspaceName,
      inviterName,
      inviteUrl,
      role
    );
    await sendEmail({ to: email, subject, html });
    console.log('[Email] Workspace invite email sent to:', email);
  } catch (error) {
    console.error('[Email] Failed to send workspace invite email:', error);
  }
}

export { sendEmail };
