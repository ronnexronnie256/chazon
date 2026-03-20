import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('ADMIN');

    const { id } = await params;
    const body = await request.json();
    const { action, adminId } = body;

    const validActions = ['DISMISSED', 'WARN', 'SUSPEND', 'BAN'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const flaggedMessage = await prisma.flaggedMessage.update({
      where: { id },
      data: {
        reviewed: true,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        action,
      },
    });

    if (action === 'WARN' || action === 'SUSPEND' || action === 'BAN') {
      const userSuspension =
        action === 'BAN'
          ? new Date('2099-12-31')
          : action === 'SUSPEND'
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            : null;

      await prisma.securityEvent.create({
        data: {
          userId: flaggedMessage.senderId,
          type: `ADMIN_ACTION_${action}`,
          severity: action === 'BAN' ? 'HIGH' : 'MEDIUM',
          details: {
            flaggedMessageId: id,
            taskId: flaggedMessage.taskId,
            violationType: flaggedMessage.violationType,
            action,
            adminId,
          },
        },
      });

      if (userSuspension) {
        await prisma.user.update({
          where: { id: flaggedMessage.senderId },
          data: { updatedAt: new Date() },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: flaggedMessage,
    });
  } catch (error) {
    console.error('Error updating flagged message:', error);
    return NextResponse.json(
      { error: 'Failed to update flagged message' },
      { status: 500 }
    );
  }
}
