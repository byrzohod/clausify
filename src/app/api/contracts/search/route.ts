import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ContractType, ContractStatus } from '@prisma/client';

const searchSchema = z.object({
  query: z.string().optional(),
  contractType: z.nativeEnum(ContractType).optional(),
  status: z.nativeEnum(ContractStatus).optional(),
  tagIds: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'fileName', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// POST /api/contracts/search - Search contracts with filters
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = searchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      query,
      contractType,
      status,
      tagIds,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = validation.data;

    // Build where clause
    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    // Text search on fileName
    if (query) {
      where.fileName = {
        contains: query,
        mode: 'insensitive',
      };
    }

    // Filter by contract type (from analysis)
    if (contractType) {
      where.analysis = {
        contractType,
      };
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by tags
    if (tagIds && tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: tagIds,
          },
        },
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    // Get total count
    const totalCount = await prisma.contract.count({ where });

    // Get contracts with pagination
    const contracts = await prisma.contract.findMany({
      where,
      include: {
        analysis: {
          select: {
            id: true,
            status: true,
            contractType: true,
            riskScore: true,
            summary: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      contracts: contracts.map((contract) => ({
        id: contract.id,
        fileName: contract.fileName,
        fileSize: contract.fileSize,
        mimeType: contract.mimeType,
        status: contract.status,
        createdAt: contract.createdAt,
        analysis: contract.analysis
          ? {
              id: contract.analysis.id,
              status: contract.analysis.status,
              contractType: contract.analysis.contractType,
              riskScore: contract.analysis.riskScore,
              summary: contract.analysis.summary?.substring(0, 200),
            }
          : null,
        tags: contract.tags.map((ct) => ct.tag),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error searching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to search contracts' },
      { status: 500 }
    );
  }
}
