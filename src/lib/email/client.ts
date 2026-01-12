/**
 * Email client for sending transactional emails
 * Uses Resend API for email delivery
 */

import { createElement } from 'react';

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Clausify <hello@clausify.app>';
const RESEND_API_URL = 'https://api.resend.com/emails';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

interface SendEmailResult {
  id: string;
  success: boolean;
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email send');
    return { id: 'mock-id', success: false };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Email] Send failed:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    const data = await response.json();
    console.log('[Email] Sent successfully:', { to: options.to, subject: options.subject, id: data.id });

    return { id: data.id, success: true };
  } catch (error) {
    console.error('[Email] Error:', error);
    throw error;
  }
}

/**
 * Email templates
 */
export function generateWelcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to Clausify!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Clausify</div>
            </div>
            <h1>Welcome to Clausify, ${name}!</h1>
            <p>You've taken the first step toward understanding your contracts better. Clausify uses AI to analyze legal documents and explain them in plain English.</p>
            <p>Here's what you can do:</p>
            <ul>
              <li>Upload PDF or DOCX contracts</li>
              <li>Get instant AI analysis</li>
              <li>Identify red flags and risks</li>
              <li>Understand key terms and obligations</li>
            </ul>
            <a href="https://clausify.app/dashboard" class="button">Upload Your First Contract</a>
            <p>You have 2 free analyses to get started. Need more? Check out our <a href="https://clausify.app/pricing">Pro plans</a>.</p>
            <div class="footer">
              <p>Clausify Inc.</p>
              <p><a href="https://clausify.app/unsubscribe">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function generateAnalysisCompleteEmail(
  fileName: string,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  redFlagsCount: number,
  contractUrl: string
): { subject: string; html: string } {
  const riskEmoji = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🔴' };
  const riskColor = { LOW: '#22c55e', MEDIUM: '#eab308', HIGH: '#ef4444' };

  return {
    subject: `Analysis Complete: ${fileName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .stats-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .stat { margin: 10px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Clausify</div>
            </div>
            <h1>Your Contract Analysis is Ready</h1>
            <p>We've finished analyzing <strong>${fileName}</strong>.</p>
            <div class="stats-box">
              <div class="stat">
                <strong>Risk Level:</strong>
                <span style="color: ${riskColor[riskLevel]}">${riskEmoji[riskLevel]} ${riskLevel}</span>
              </div>
              <div class="stat">
                <strong>Red Flags Found:</strong> ${redFlagsCount}
              </div>
            </div>
            <a href="${contractUrl}" class="button">View Full Analysis</a>
            <p>This analysis includes a summary, key terms, obligations, and negotiation tips to help you make informed decisions.</p>
            <div class="footer">
              <p>Clausify Inc.</p>
              <p><a href="https://clausify.app/settings/notifications">Manage email preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function generateExpirationAlertEmail(
  contractName: string,
  expirationDate: string,
  daysUntil: number,
  contractUrl: string
): { subject: string; html: string } {
  const isUrgent = daysUntil <= 7;

  return {
    subject: `${isUrgent ? '⚠️ Urgent: ' : ''}Contract expiring in ${daysUntil} days: ${contractName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .urgent { background: #fef2f2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Clausify</div>
            </div>
            <h1>${isUrgent ? '⚠️ Urgent: ' : '📅 '}Contract Expiring Soon</h1>
            <p>Your contract <strong>${contractName}</strong> expires on <strong>${expirationDate}</strong> (${daysUntil} days from now).</p>
            ${isUrgent ? `
              <div class="urgent">
                <strong>This contract expires in less than a week.</strong> Take action now to avoid any disruption.
              </div>
            ` : ''}
            <a href="${contractUrl}" class="button">Review Contract</a>
            <p>Consider whether you need to renew, renegotiate, or let this contract expire.</p>
            <div class="footer">
              <p>Clausify Inc.</p>
              <p><a href="https://clausify.app/settings/notifications">Manage email preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function generatePasswordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Reset your Clausify password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Clausify</div>
            </div>
            <h1>Reset Your Password</h1>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <div class="footer">
              <p>Clausify Inc.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function generateWorkspaceInviteEmail(
  workspaceName: string,
  inviterName: string,
  inviteUrl: string,
  role: string
): { subject: string; html: string } {
  return {
    subject: `You've been invited to ${workspaceName} on Clausify`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .invite-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Clausify</div>
            </div>
            <h1>You're Invited!</h1>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on Clausify as a <strong>${role}</strong>.</p>
            <div class="invite-box">
              <p>Clausify helps teams analyze contracts with AI and collaborate on legal documents.</p>
            </div>
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
            <p>This invitation will expire in 7 days.</p>
            <div class="footer">
              <p>Clausify Inc.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
