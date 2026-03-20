import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const disputeReasons = [
  'QUALITY_ISSUE',
  'NO_SHOW',
  'DAMAGE',
  'OVERCHARGE',
  'INCOMPLETE_WORK',
  'COMMUNICATION',
  'OTHER',
] as const;

const createDisputeSchema = z.object({
  taskId: z.string(),
  reason: z.enum(disputeReasons),
  description: z
    .string()
    .min(20, 'Please provide more details (at least 20 characters)'),
  evidence: z.array(z.string().url()).optional().default([]),
});

/**
 * POST /api/disputes - File a new dispute
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createDisputeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { taskId, reason, description, evidence } = parsed.data;

    // Check if task exists and user is involved
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        client: true,
        steward: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user is the client or steward on this task
    const isClient = task.clientId === authUser.id;
    const isSteward = task.stewardId === authUser.id;

    if (!isClient && !isSteward) {
      return NextResponse.json(
        { error: 'You are not authorized to file a dispute for this task' },
        { status: 403 }
      );
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findUnique({
      where: { taskId },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: 'A dispute has already been filed for this task' },
        { status: 400 }
      );
    }

    // Only allow disputes on completed or cancelled tasks
    if (!['DONE', 'CANCELLED', 'DISPUTED'].includes(task.status)) {
      return NextResponse.json(
        {
          error: 'Disputes can only be filed for completed or cancelled tasks',
        },
        { status: 400 }
      );
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        taskId,
        openerId: authUser.id,
        reason,
        description,
        evidence,
        status: 'OPEN',
      },
      include: {
        task: {
          include: {
            client: {
              select: { id: true, name: true, email: true },
            },
            steward: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        opener: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Update task status to DISPUTED
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'DISPUTED' },
    });

    return NextResponse.json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to create dispute' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/disputes - List disputes for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: any = {
      OR: [
        { openerId: authUser.id },
        { task: { clientId: authUser.id } },
        { task: { stewardId: authUser.id } },
      ],
    };

    if (status) {
      where.status = status;
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          task: {
            include: {
              client: { select: { id: true, name: true, email: true } },
              steward: { select: { id: true, name: true, email: true } },
            },
          },
          opener: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

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
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}
