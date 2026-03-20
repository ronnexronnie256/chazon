import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the admin email
    if (user.email !== 'admin@chazon.com') {
      return NextResponse.json(
        { error: 'Forbidden - not admin' },
        { status: 403 }
      );
    }

    // Update user to ADMIN role
    const updatedUser = await prisma.user.update({
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
      message: 'Admin role set successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error setting admin role:', error);
    return NextResponse.json(
      { error: 'Failed to set admin role' },
      { status: 500 }
    );
  }
}
