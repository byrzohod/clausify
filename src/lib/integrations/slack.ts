/**
 * Slack integration utilities
 */

import { prisma } from '@/lib/prisma';

/**
 * Send a Slack notification for a completed analysis
 */
export async function notifySlackAnalysisComplete(
  userId: string,
  contractName: string,
  riskScore: string,
  analysisUrl: string
): Promise<void> {
  const integration = await prisma.slackIntegration.findUnique({
    where: { userId },
  });

  if (!integration?.webhookUrl || !integration.notifyOnAnalysis) {
    return;
  }

  const riskEmoji =
    riskScore === 'LOW' ? '🟢' : riskScore === 'MEDIUM' ? '🟡' : '🔴';

  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📄 Contract Analysis Complete',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Contract:*\n${contractName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Risk Level:*\n${riskEmoji} ${riskScore}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Analysis',
              emoji: true,
            },
            url: analysisUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };

  try {
    await fetch(integration.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}
