import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  contractType: z.enum([
    'NDA',
    'EMPLOYMENT',
    'LEASE',
    'SERVICE',
    'FREELANCE',
    'SALES',
    'PARTNERSHIP',
    'LICENSE',
    'LOAN',
    'OTHER',
  ]),
  content: z.string().min(1),
  isPublic: z.boolean().optional(),
});

// GET /api/templates - List user's templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractType = searchParams.get('contractType');

    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isPublic: true },
        ],
        ...(contractType && { contractType: contractType as never }),
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        contractType: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[API] Templates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        description: parsed.data.description,
        contractType: parsed.data.contractType,
        content: parsed.data.content,
        isPublic: parsed.data.isPublic ?? false,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('[API] Templates POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
