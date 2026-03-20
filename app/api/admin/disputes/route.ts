import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          task: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              steward: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          opener: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    const statusCounts = await prisma.dispute.groupBy({
      by: ['status'],
      _count: true,
    });

    const counts = {
      total,
      OPEN: 0,
      UNDER_REVIEW: 0,
      ESCALATED: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    for (const item of statusCounts) {
      if (item.status in counts) {
        counts[item.status as keyof typeof counts] = item._count;
      }
    }

    return NextResponse.json({
      success: true,
      data: disputes,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      counts,
    });
  } catch (error: any) {
    console.error('Error fetching disputes:', error);

    if (error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireRole('ADMIN');

    const body = await req.json();
    const { disputeId, status, resolution, refundAmount, payoutAmount } = body;

    if (!disputeId) {
      return NextResponse.json(
        { success: false, error: 'Dispute ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;

      if (status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
      }
    }

    if (resolution) {
      updateData.resolution = resolution;
    }

    if (refundAmount !== undefined) {
      updateData.refundAmount = refundAmount;
    }

    if (payoutAmount !== undefined) {
      updateData.payoutAmount = payoutAmount;
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: updateData,
      include: {
        task: {
          include: {
            client: true,
            steward: true,
          },
        },
        opener: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedDispute,
    });
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update dispute' },
      { status: 500 }
    );
  }
}
