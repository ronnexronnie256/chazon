import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [disputes, applications, flaggedMessages, newUsers] =
      await Promise.all([
        prisma.dispute.count({ where: { status: 'OPEN' } }),
        prisma.stewardProfile.count({
          where: { backgroundCheckStatus: 'PENDING' },
        }),
        prisma.flaggedMessage.count({ where: { reviewed: false } }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

    return NextResponse.json({
      disputes,
      applications,
      flagged: flaggedMessages,
      users: newUsers,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({
      disputes: 0,
      applications: 0,
      flagged: 0,
      users: 0,
    });
  }
}
