import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/disputes/[id] - Get dispute details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            client: {
              select: { id: true, name: true, email: true, phone: true },
            },
            steward: {
              select: { id: true, name: true, email: true, phone: true },
            },
            transactions: true,
          },
        },
        opener: { select: { id: true, name: true, email: true } },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    // Check if user is authorized
    const isOpener = dispute.openerId === authUser.id;
    const isClient = dispute.task.clientId === authUser.id;
    const isSteward = dispute.task.stewardId === authUser.id;
    const isAdmin = authUser.role === 'ADMIN';

    if (!isOpener && !isClient && !isSteward && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to view this dispute' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    console.error('Error fetching dispute:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispute' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/disputes/[id] - Update dispute (resolve, add evidence, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, resolution, refundAmount, payoutAmount } = body;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    // Check if user is admin for resolution actions
    if (action === 'resolve' || action === 'escalate') {
      if (authUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only admins can resolve or escalate disputes' },
          { status: 403 }
        );
      }
    }

    // Regular users can add evidence
    if (action === 'add_evidence') {
      const isOpener = dispute.openerId === authUser.id;
      const isClient = dispute.task.clientId === authUser.id;
      const isSteward = dispute.task.stewardId === authUser.id;

      if (!isOpener && !isClient && !isSteward) {
        return NextResponse.json(
          { error: 'You are not authorized to add evidence to this dispute' },
          { status: 403 }
        );
      }

      if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
        return NextResponse.json(
          { error: 'Cannot add evidence to a resolved or closed dispute' },
          { status: 400 }
        );
      }

      const updated = await prisma.dispute.update({
        where: { id },
        data: {
          evidence: {
            push: body.evidence,
          },
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Admin: Mark as under review
    if (action === 'start_review') {
      const updated = await prisma.dispute.update({
        where: { id },
        data: { status: 'UNDER_REVIEW' },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Admin: Escalate
    if (action === 'escalate') {
      const updated = await prisma.dispute.update({
        where: { id },
        data: { status: 'ESCALATED' },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Admin: Resolve dispute
    if (action === 'resolve') {
      if (!resolution) {
        return NextResponse.json(
          { error: 'Resolution notes are required' },
          { status: 400 }
        );
      }

      const updated = await prisma.dispute.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolution,
          refundAmount: refundAmount || null,
          payoutAmount: payoutAmount || null,
          resolvedAt: new Date(),
        },
        include: {
          task: {
            include: {
              client: { select: { id: true, name: true } },
              steward: { select: { id: true, name: true } },
            },
          },
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Admin: Close dispute without resolution
    if (action === 'close') {
      const updated = await prisma.dispute.update({
        where: { id },
        data: { status: 'CLOSED' },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to update dispute' },
      { status: 500 }
    );
  }
}
