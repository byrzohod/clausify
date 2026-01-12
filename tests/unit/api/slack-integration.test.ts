import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    slackIntegration: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

describe('Slack Integration API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/integrations/slack', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/integrations/slack/route');
      const response = await GET();

      expect(response.status).toBe(401);
    });

    it('should return not connected when no integration exists', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.slackIntegration.findUnique).mockResolvedValue(null);

      const { GET } = await import('@/app/api/integrations/slack/route');
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.connected).toBe(false);
      expect(data.integration).toBeNull();
    });

    it('should return integration details when connected', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.slackIntegration.findUnique).mockResolvedValue({
        id: 'integration-1',
        userId: 'user-1',
        teamId: 'T123',
        teamName: 'Test Team',
        channelId: 'C123',
        channelName: '#general',
        notifyOnAnalysis: true,
        createdAt: new Date(),
      } as never);

      const { GET } = await import('@/app/api/integrations/slack/route');
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.connected).toBe(true);
      expect(data.integration.teamName).toBe('Test Team');
      expect(data.integration.channelName).toBe('#general');
    });
  });

  describe('PATCH /api/integrations/slack', () => {
    it('should update integration settings', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.slackIntegration.update).mockResolvedValue({
        channelId: 'C456',
        channelName: '#contracts',
        notifyOnAnalysis: false,
      } as never);

      const { PATCH } = await import('@/app/api/integrations/slack/route');
      const request = new Request('http://localhost/api/integrations/slack', {
        method: 'PATCH',
        body: JSON.stringify({
          channelId: 'C456',
          channelName: '#contracts',
          notifyOnAnalysis: false,
        }),
      });

      const response = await PATCH(request as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.integration.channelName).toBe('#contracts');
      expect(data.integration.notifyOnAnalysis).toBe(false);
    });

    it('should validate webhook URL format', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const { PATCH } = await import('@/app/api/integrations/slack/route');
      const request = new Request('http://localhost/api/integrations/slack', {
        method: 'PATCH',
        body: JSON.stringify({
          webhookUrl: 'not-a-valid-url',
        }),
      });

      const response = await PATCH(request as never);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/integrations/slack', () => {
    it('should disconnect Slack integration', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });
      vi.mocked(prisma.slackIntegration.delete).mockResolvedValue({} as never);

      const { DELETE } = await import('@/app/api/integrations/slack/route');
      const response = await DELETE();

      expect(response.status).toBe(200);
      expect(prisma.slackIntegration.delete).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});

describe('notifySlackAnalysisComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should send notification when integration exists and enabled', async () => {
    vi.mocked(prisma.slackIntegration.findUnique).mockResolvedValue({
      webhookUrl: 'https://hooks.slack.com/services/xxx',
      notifyOnAnalysis: true,
    } as never);
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as never);

    const { notifySlackAnalysisComplete } = await import(
      '@/lib/integrations/slack'
    );
    await notifySlackAnalysisComplete(
      'user-1',
      'contract.pdf',
      'LOW',
      'https://app.example.com/contracts/1'
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/xxx',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should not send notification when notifyOnAnalysis is disabled', async () => {
    vi.mocked(prisma.slackIntegration.findUnique).mockResolvedValue({
      webhookUrl: 'https://hooks.slack.com/services/xxx',
      notifyOnAnalysis: false,
    } as never);

    const { notifySlackAnalysisComplete } = await import(
      '@/lib/integrations/slack'
    );
    await notifySlackAnalysisComplete(
      'user-1',
      'contract.pdf',
      'LOW',
      'https://app.example.com/contracts/1'
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should not send notification when no webhook URL', async () => {
    vi.mocked(prisma.slackIntegration.findUnique).mockResolvedValue({
      webhookUrl: null,
      notifyOnAnalysis: true,
    } as never);

    const { notifySlackAnalysisComplete } = await import(
      '@/lib/integrations/slack'
    );
    await notifySlackAnalysisComplete(
      'user-1',
      'contract.pdf',
      'LOW',
      'https://app.example.com/contracts/1'
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should include correct risk emoji in message', async () => {
    vi.mocked(prisma.slackIntegration.findUnique).mockResolvedValue({
      webhookUrl: 'https://hooks.slack.com/services/xxx',
      notifyOnAnalysis: true,
    } as never);
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as never);

    const { notifySlackAnalysisComplete } = await import(
      '@/lib/integrations/slack'
    );
    await notifySlackAnalysisComplete(
      'user-1',
      'contract.pdf',
      'HIGH',
      'https://app.example.com/contracts/1'
    );

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]?.body as string);
    const riskField = body.blocks[1].fields.find((f: { text: string }) =>
      f.text.includes('Risk Level')
    );
    expect(riskField.text).toContain('🔴');
    expect(riskField.text).toContain('HIGH');
  });
});
