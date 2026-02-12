import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, requireTrustLevel, StepUpError } from '@/lib/clerk/auth'
import { $Enums, Prisma } from '@prisma/client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole('ADMIN')
    
    // Enforce Step-Up Authentication
    try {
        await requireTrustLevel(admin, 'HIGH', 'freeze_task')
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

    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.status === $Enums.TaskStatus.ADMIN_FROZEN) {
      return NextResponse.json(
        { error: 'Task is already frozen' },
        { status: 400 }
      )
    }
    
    if (task.status === $Enums.TaskStatus.ADMIN_CANCELLED) {
        return NextResponse.json(
          { error: 'Cannot freeze a cancelled task' },
          { status: 400 }
        )
    }

    // Prepare metadata with previous status
    const metadata = (task.metadata as Prisma.JsonObject) || {}
    const updatedMetadata = {
        ...metadata,
        previousStatus: task.status
    }

    // Freeze task and log security event
    await prisma.$transaction([
      prisma.task.update({
        where: { id },
        data: { 
            status: $Enums.TaskStatus.ADMIN_FROZEN,
            metadata: updatedMetadata
        },
      }),
      prisma.securityEvent.create({
        data: {
          type: 'BOOKING_FROZEN',
          userId: admin.id,
          details: {
            taskId: id,
            previousStatus: task.status,
            reason: 'Admin action',
          },
        },
      }),
    ])

    return NextResponse.json({ success: true, message: 'Task frozen' })
  } catch (error: any) {
    console.error('Error freezing task:', error)
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
