import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists by ID
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true },
    });

    // If found by ID, just update role
    if (dbUser && dbUser.role !== 'ADMIN') {
      dbUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
        select: { id: true, email: true, name: true, role: true },
      });
    }
    // If found by email with different ID, we need to update the ID
    else if (!dbUser) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: user.email || 'admin@chazon.com' },
      });

      if (existingByEmail) {
        // Delete the old record and create new with correct ID
        await prisma.user.delete({
          where: { id: existingByEmail.id },
        });
      }

      // Create with correct ID
      dbUser = await prisma.user.create({
        data: {
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
      authId: user.id,
    });
  } catch (error) {
    console.error('Fix admin error:', error);
    return NextResponse.json(
      { error: 'Failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
