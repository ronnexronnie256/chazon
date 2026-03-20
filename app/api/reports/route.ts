import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      taskId,
      messageId,
      reporterId,
      reportedUserId,
      reason,
      messageContent,
    } = body;

    if (!taskId || !reporterId || !reportedUserId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const report = await prisma.flaggedMessage.create({
      data: {
        messageId,
        senderId: reportedUserId,
        recipientId: reporterId,
        taskId,
        originalContent: messageContent || '',
        violationType: reason,
        severity: 'HIGH',
      },
    });

    await prisma.securityEvent.create({
      data: {
        userId: reportedUserId,
        type: `USER_REPORT_${reason}`,
        severity: 'HIGH',
        details: {
          taskId,
          messageId,
          reporterId,
          reason,
        },
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}
