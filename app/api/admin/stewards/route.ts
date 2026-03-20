/**
 * Admin API routes for steward management
 * Only accessible to ADMIN users
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/stewards
 * Get all steward applications with filters
 * Query params: status (PENDING, CLEARED, REJECTED), page, limit
 */
export async function GET(req: NextRequest) {
  try {
    // Require admin role
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // PENDING, CLEARED, REJECTED
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) {
      where.backgroundCheckStatus = status;
    }

    // Get steward profiles with user data
    const [stewards, total] = await Promise.all([
      prisma.stewardProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stewardProfile.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: stewards,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching steward applications:', error);

    if (
      error.message?.includes('Unauthorized') ||
      error.message?.includes('ADMIN')
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch steward applications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/stewards
 * Update steward status (APPROVED, REJECTED, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const body = await req.json();
    const { stewardId, status } = body;

    if (!stewardId || !status) {
      return NextResponse.json(
        { error: 'stewardId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'APPLIED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'SUSPENDED',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.stewardProfile.update({
      where: { id: stewardId },
      data: { status },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.user.name,
        email: updated.user.email,
        status: updated.status,
      },
    });
  } catch (error: any) {
    console.error('Error updating steward:', error);

    if (
      error.message?.includes('Unauthorized') ||
      error.message?.includes('ADMIN')
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update steward' },
      { status: 500 }
    );
  }
}
