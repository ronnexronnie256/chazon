import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/clerk/auth'
import { getSystemConfig } from '@/lib/config'
import { notifyAdminsOfHighSeverityEvent } from '@/lib/notifications/admin-alerts'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN')

    const body = await req.json()
    const { enabled, reason } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid enabled value' }, { status: 400 })
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ success: false, error: 'Reason is required and must be at least 5 characters' }, { status: 400 })
    }

    const config = await getSystemConfig()

    // Transaction
    const { event } = await prisma.$transaction(async (tx) => {
      // Update Config
      await tx.systemConfig.update({
        where: { id: config.id },
        data: { bookingsEnabled: enabled },
      })

      // Log Security Event
      const event = await tx.securityEvent.create({
        data: {
          type: 'SYSTEM_FLAG_TOGGLED',
          severity: 'HIGH',
          userId: user.id,
          details: {
            flag: 'bookingsEnabled',
            newValue: enabled,
            reason: reason,
            oldValue: config.bookingsEnabled
          }
        }
      })

      return { event }
    })

    // Trigger Admin Notification (Async, Non-blocking)
    notifyAdminsOfHighSeverityEvent(event)

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error('Error toggling bookings flag:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
