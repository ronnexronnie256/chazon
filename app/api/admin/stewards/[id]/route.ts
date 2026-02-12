/**
 * Admin API routes for individual steward management
 * Only accessible to ADMIN users
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/admin/stewards/[id]
 * Approve or reject a steward application
 * Body: { action: 'approve' | 'reject', reason?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    await requireRole('ADMIN')

    const { id } = await params
    const body = await req.json()
    const { action, reason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get steward profile
    const stewardProfile = await prisma.stewardProfile.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!stewardProfile) {
      return NextResponse.json(
        { success: false, error: 'Steward profile not found' },
        { status: 404 }
      )
    }

    // Update based on action
    if (action === 'approve') {
      // Approve: Set status to CLEARED and update user role to STEWARD
      await prisma.$transaction([
        prisma.stewardProfile.update({
          where: { id },
          data: {
            backgroundCheckStatus: 'CLEARED',
          },
        }),
        prisma.user.update({
          where: { id: stewardProfile.userId },
          data: {
            role: 'STEWARD',
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        message: 'Steward application approved successfully',
        data: {
          ...stewardProfile,
          backgroundCheckStatus: 'CLEARED',
          user: {
            ...stewardProfile.user,
            role: 'STEWARD',
          },
        },
      })
    } else {
      // Reject: Set status to REJECTED, keep role as CLIENT
      await prisma.stewardProfile.update({
        where: { id },
        data: {
          backgroundCheckStatus: 'REJECTED',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Steward application rejected',
        data: {
          ...stewardProfile,
          backgroundCheckStatus: 'REJECTED',
        },
      })
    }
  } catch (error: any) {
    console.error('Error updating steward application:', error)
    
    if (error.message?.includes('Unauthorized') || error.message?.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update steward application' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/stewards/[id]
 * Get a single steward application details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    await requireRole('ADMIN')

    const { id } = await params

    const stewardProfile = await prisma.stewardProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
      },
    })

    if (!stewardProfile) {
      return NextResponse.json(
        { success: false, error: 'Steward profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: stewardProfile,
    })
  } catch (error: any) {
    console.error('Error fetching steward application:', error)
    
    if (error.message?.includes('Unauthorized') || error.message?.includes('ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch steward application' },
      { status: 500 }
    )
  }
}
