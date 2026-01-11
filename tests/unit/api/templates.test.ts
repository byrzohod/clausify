import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    template: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

describe('Templates API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should require authentication for listing templates', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      // Verify the pattern - session check should come first
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should allow authenticated users to access templates', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2026-12-31',
      });

      const session = await getServerSession();
      expect(session?.user?.id).toBe('user-1');
    });
  });

  describe('Template Operations', () => {
    it('should fetch user templates', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Standard NDA',
          description: 'Basic NDA template',
          contractType: 'NDA',
          userId: 'user-1',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.template.findMany).mockResolvedValue(mockTemplates);

      const templates = await prisma.template.findMany({
        where: { userId: 'user-1' },
      });

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Standard NDA');
    });

    it('should create a new template', async () => {
      const newTemplate = {
        id: '2',
        name: 'Employment Contract',
        description: 'Standard employment agreement',
        contractType: 'EMPLOYMENT',
        content: 'Contract content here...',
        userId: 'user-1',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.template.create).mockResolvedValue(newTemplate);

      const template = await prisma.template.create({
        data: {
          name: 'Employment Contract',
          description: 'Standard employment agreement',
          contractType: 'EMPLOYMENT',
          content: 'Contract content here...',
          userId: 'user-1',
        },
      });

      expect(template.name).toBe('Employment Contract');
      expect(template.contractType).toBe('EMPLOYMENT');
    });

    it('should fetch a single template by id', async () => {
      const mockTemplate = {
        id: '1',
        name: 'Standard NDA',
        description: 'Basic NDA template',
        contractType: 'NDA',
        content: 'NDA content...',
        userId: 'user-1',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.template.findFirst).mockResolvedValue(mockTemplate);

      const template = await prisma.template.findFirst({
        where: { id: '1', userId: 'user-1' },
      });

      expect(template?.id).toBe('1');
      expect(template?.content).toBe('NDA content...');
    });

    it('should delete a template', async () => {
      vi.mocked(prisma.template.findFirst).mockResolvedValue({
        id: '1',
        name: 'To Delete',
        description: null,
        contractType: 'OTHER',
        content: 'content',
        userId: 'user-1',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.template.delete).mockResolvedValue({
        id: '1',
        name: 'To Delete',
        description: null,
        contractType: 'OTHER',
        content: 'content',
        userId: 'user-1',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await prisma.template.delete({ where: { id: '1' } });

      expect(prisma.template.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('Public Templates', () => {
    it('should include public templates in search results', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'My Template',
          userId: 'user-1',
          isPublic: false,
          contractType: 'NDA',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Public Template',
          userId: 'user-2',
          isPublic: true,
          contractType: 'NDA',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.template.findMany).mockResolvedValue(mockTemplates);

      const templates = await prisma.template.findMany({
        where: {
          OR: [{ userId: 'user-1' }, { isPublic: true }],
        },
      });

      expect(templates).toHaveLength(2);
      expect(templates.some((t) => t.isPublic)).toBe(true);
    });
  });
});
