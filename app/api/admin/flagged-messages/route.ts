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
        ? { reviewed: false }
        : filter === 'reviewed'
          ? { reviewed: true }
          : {};

    const flaggedMessages = await prisma.flaggedMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Get unique sender IDs
    const senderIdSet = new Set<string>();
    for (const msg of flaggedMessages) {
      senderIdSet.add(msg.senderId);
    }
    const senderIds = Array.from(senderIdSet);

    const senders =
      senderIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: senderIds } },
            select: { id: true, name: true, email: true },
          })
        : [];

    const senderMap = new Map<
      string,
      { id: string; name: string; email: string | null }
    >();
    for (const s of senders) {
      senderMap.set(s.id, s);
    }

    const messagesWithSenders = flaggedMessages.map(msg => ({
      ...msg,
      sender: senderMap.get(msg.senderId),
    }));

    return NextResponse.json({
      success: true,
      data: messagesWithSenders,
    });
  } catch (error) {
    console.error('Error fetching flagged messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flagged messages' },
      { status: 500 }
    );
  }
}
