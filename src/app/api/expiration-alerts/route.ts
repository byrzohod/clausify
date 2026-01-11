import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAlertSchema = z.object({
  contractId: z.string(),
  expirationDate: z.string().datetime(),
  alertDays: z.number().int().min(1).max(365).default(30),
});

// GET /api/expiration-alerts - Get user's expiration alerts
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming') === 'true';

    const where: Record<string, unknown> = { userId: session.user.id };

    if (upcoming) {
      // Get alerts that are due to trigger in the next 30 days
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      where.notified = false;
      where.expirationDate = {
        lte: thirtyDaysFromNow,
      };
    }

    const alerts = await prisma.expirationAlert.findMany({
      where,
      include: {
        contract: {
          select: {
            id: true,
            fileName: true,
            status: true,
            analysis: {
              select: {
                contractType: true,
              },
            },
          },
        },
      },
      orderBy: { expirationDate: 'asc' },
    });

    return NextResponse.json({
      alerts: alerts.map((alert) => ({
        id: alert.id,
        contractId: alert.contractId,
        contractName: alert.contract.fileName,
        contractType: alert.contract.analysis?.contractType,
        expirationDate: alert.expirationDate,
        alertDays: alert.alertDays,
        alertDate: new Date(
          alert.expirationDate.getTime() -
            alert.alertDays * 24 * 60 * 60 * 1000
        ),
        notified: alert.notified,
        daysUntilExpiration: Math.ceil(
          (alert.expirationDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        ),
      })),
    });
  } catch (error) {
    console.error('Error fetching expiration alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// POST /api/expiration-alerts - Create an expiration alert
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createAlertSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { contractId, expirationDate, alertDays } = validation.data;

    // Verify contract belongs to user
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, userId: session.user.id },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if alert already exists
    const existingAlert = await prisma.expirationAlert.findUnique({
      where: { contractId },
    });

    if (existingAlert) {
      // Update existing alert
      const alert = await prisma.expirationAlert.update({
        where: { id: existingAlert.id },
        data: {
          expirationDate: new Date(expirationDate),
          alertDays,
          notified: false,
        },
      });

      return NextResponse.json({ alert });
    }

    // Create new alert
    const alert = await prisma.expirationAlert.create({
      data: {
        userId: session.user.id,
        contractId,
        expirationDate: new Date(expirationDate),
        alertDays,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Error creating expiration alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

// DELETE /api/expiration-alerts?contractId=xxx - Delete an expiration alert
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');

    if (!contractId) {
      return NextResponse.json(
        { error: 'contractId required' },
        { status: 400 }
      );
    }

    // Verify alert belongs to user
    const alert = await prisma.expirationAlert.findFirst({
      where: { contractId, userId: session.user.id },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    await prisma.expirationAlert.delete({
      where: { id: alert.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expiration alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}
