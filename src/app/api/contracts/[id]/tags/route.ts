import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const tagActionSchema = z.object({
  tagId: z.string(),
});

// GET /api/contracts/[id]/tags - Get tags for a contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: contractId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contract = await prisma.contract.findFirst({
      where: { id: contractId, userId: session.user.id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({
      tags: contract.tags.map((ct) => ({
        id: ct.tag.id,
        name: ct.tag.name,
        color: ct.tag.color,
      })),
    });
  } catch (error) {
    console.error('Error fetching contract tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract tags' },
      { status: 500 }
    );
  }
}

// POST /api/contracts/[id]/tags - Add a tag to a contract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: contractId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = tagActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { tagId } = validation.data;

    // Verify contract belongs to user
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, userId: session.user.id },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Verify tag belongs to user
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId: session.user.id },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Check if already tagged
    const existing = await prisma.contractTag.findUnique({
      where: {
        contractId_tagId: {
          contractId,
          tagId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Contract already has this tag' },
        { status: 409 }
      );
    }

    await prisma.contractTag.create({
      data: {
        contractId,
        tagId,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding tag to contract:', error);
    return NextResponse.json(
      { error: 'Failed to add tag' },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id]/tags - Remove a tag from a contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: contractId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');

    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId query parameter required' },
        { status: 400 }
      );
    }

    // Verify contract belongs to user
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, userId: session.user.id },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Delete the tag association
    await prisma.contractTag.deleteMany({
      where: {
        contractId,
        tagId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tag from contract:', error);
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 }
    );
  }
}
