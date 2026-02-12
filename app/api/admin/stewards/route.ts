/**
 * Admin API routes for steward management
 * Only accessible to ADMIN users
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/stewards
 * Get all steward applications with filters
 * Query params: status (PENDING, CLEARED, REJECTED), page, limit
 */
export async function GET(req: NextRequest) {
  try {
    // Require admin role
    await requireRole('ADMIN')

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // PENDING, CLEARED, REJECTED
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.backgroundCheckStatus = status
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
    ])

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
    })
  } catch (error: any) {
    console.error('Error fetching steward applications:', error)
    
    if (error.message?.includes('Unauthorized') || error.message?.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch steward applications' },
      { status: 500 }
    )
  }
}
