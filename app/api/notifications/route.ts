import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/notifications
 * Get user's notifications
 * Query params: ?unreadOnly=true, ?limit=20, ?page=1
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: any = {
      userId: user.id,
    }

    if (unreadOnly) {
      where.readAt = null
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.notification.count({ where }),
    ])

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        readAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      data: notifications,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Mark notifications as read
 * Body: { notificationIds: string[] } or { markAllAsRead: true }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationIds, markAllAsRead } = body

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id, // Ensure user owns these notifications
        },
        data: {
          readAt: new Date(),
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

