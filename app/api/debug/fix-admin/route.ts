import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Force update role to ADMIN
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Role updated to ADMIN',
      user: updated,
    });
  } catch (error) {
    console.error('Fix role error:', error);
    return NextResponse.json(
      { error: 'Failed to update role', details: (error as Error).message },
      { status: 500 }
    );
  }
}
