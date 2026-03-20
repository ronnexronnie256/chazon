import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'pending';

    const where =
      filter === 'pending'
        ? { isFlagged: true, reviewed: false }
        : filter === 'reviewed'
          ? { isFlagged: true, reviewed: true }
          : { isFlagged: true };

    const flaggedMessages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true },
        },
        task: {
          select: { id: true, status: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: flaggedMessages,
    });
  } catch (error) {
    console.error('Error fetching flagged messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flagged messages' },
      { status: 500 }
    );
  }
}
