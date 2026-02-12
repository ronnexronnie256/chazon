import { NextResponse } from 'next/server'
import { requireRole, requireTrustLevel, StepUpError } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    await requireRole('ADMIN')

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') // 'CLIENT', 'STEWARD', or null for all
    const search = searchParams.get('search') // Search by name or email
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (role) {
      where.role = role
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          stewardProfile: {
            select: {
              id: true,
              backgroundCheckStatus: true,
              rating: true,
              completedTasks: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              tasksAsClient: true,
              tasksAsSteward: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        image: u.image,
        isIdentityVerified: u.isIdentityVerified,
        createdAt: u.createdAt,
        stewardProfile: u.stewardProfile,
        taskCounts: {
          asClient: u._count.tasksAsClient,
          asSteward: u._count.tasksAsSteward
        }
      })),
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireRole('ADMIN')

    // Enforce Step-Up Authentication
    try {
        await requireTrustLevel(user, 'HIGH', 'update_user_role')
    } catch (error) {
        if (error instanceof StepUpError) {
            return NextResponse.json(
                { 
                    error: error.message, 
                    code: error.code,
                    requiresReauth: true,
                    provider: "google" 
                },
                { status: 403 }
            )
        }
        throw error
    }

    const body = await req.json()
    const { userId, updates } = body

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, error: 'User ID and updates are required' },
        { status: 400 }
      )
    }

    // Prevent admin from changing their own role
    if (userId === user.id && updates.role) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      include: {
        stewardProfile: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireRole('ADMIN')

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
