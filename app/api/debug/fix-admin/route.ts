import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists by email
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email || 'admin@chazon.com' },
      select: { id: true, email: true, name: true, role: true },
    });

    // If found by email but different ID, update by email
    if (dbUser && dbUser.role !== 'ADMIN') {
      dbUser = await prisma.user.update({
        where: { email: user.email || 'admin@chazon.com' },
        data: { role: 'ADMIN' },
        select: { id: true, email: true, name: true, role: true },
      });
    }

    // If no user found at all, create with upsert
    if (!dbUser) {
      dbUser = await prisma.user.upsert({
        where: { id: user.id },
        update: { role: 'ADMIN' },
        create: {
          id: user.id,
          name: user.name || 'Admin User',
          email: user.email || 'admin@chazon.com',
          role: 'ADMIN',
        },
        select: { id: true, email: true, name: true, role: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'You are now an ADMIN',
      user: dbUser,
    });
  } catch (error) {
    console.error('Fix admin error:', error);
    return NextResponse.json(
      { error: 'Failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
