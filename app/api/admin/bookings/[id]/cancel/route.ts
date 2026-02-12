import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, requireTrustLevel, StepUpError } from '@/lib/clerk/auth'
import { $Enums } from '@prisma/client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole('ADMIN')
    try {
      await requireTrustLevel(admin, 'HIGH', 'cancel_task')
    } catch (error) {
      if (error instanceof StepUpError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            requiresReauth: true,
            provider: 'google',
          },
          { status: 403 }
        )
      }
      throw error
    }
    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.status === $Enums.TaskStatus.ADMIN_CANCELLED) {
      return NextResponse.json(
        { error: 'Task is already cancelled by admin' },
        { status: 400 }
      )
    }

    // Cancel task and log security event
    // Note: We do NOT refund or move money automatically as per requirements ("Do NOT touch escrow...")
    await prisma.$transaction([
      prisma.task.update({
        where: { id },
        data: { 
            status: $Enums.TaskStatus.ADMIN_CANCELLED,
        },
      }),
      prisma.securityEvent.create({
        data: {
          type: 'BOOKING_ADMIN_CANCELLED',
          userId: admin.id,
          details: {
            taskId: id,
            previousStatus: task.status,
            reason: 'Admin action',
          },
        },
      }),
    ])

    return NextResponse.json({ success: true, message: 'Task cancelled by admin' })
  } catch (error: any) {
    console.error('Error cancelling task:', error)
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
