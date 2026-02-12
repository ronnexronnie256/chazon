import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tasks/[id]/milestones
 * Get all milestones for a task
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        client: true,
        steward: true,
      },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    // Check authorization
    if (task.clientId !== user.id && task.stewardId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const milestones = await prisma.paymentMilestone.findMany({
      where: { taskId: id },
      include: {
        transactions: {
          where: {
            status: 'COMPLETED',
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: milestones,
    })
  } catch (error: any) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks/[id]/milestones
 * Create milestones for a task (PRD 6.6: Partial payments for long tasks)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    // Only client or admin can create milestones
    if (task.clientId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Can only create milestones if task is OPEN or ASSIGNED
    if (task.status !== 'OPEN' && task.status !== 'ASSIGNED') {
      return NextResponse.json(
        { success: false, error: 'Milestones can only be created for OPEN or ASSIGNED tasks' },
        { status: 400 }
      )
    }

    // Check if milestones already exist
    const existingMilestones = await prisma.paymentMilestone.count({
      where: { taskId: id },
    })

    if (existingMilestones > 0) {
      return NextResponse.json(
        { success: false, error: 'Milestones already exist for this task' },
        { status: 400 }
      )
    }

    const { milestones } = body

    if (!Array.isArray(milestones) || milestones.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Milestones array is required' },
        { status: 400 }
      )
    }

    // Validate milestones
    let totalAmount = 0
    for (const milestone of milestones) {
      if (!milestone.name || !milestone.amount || milestone.amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Each milestone must have a name and positive amount' },
          { status: 400 }
        )
      }
      totalAmount += milestone.amount
    }

    // Validate total doesn't exceed task price
    if (totalAmount > task.agreedPrice) {
      return NextResponse.json(
        { success: false, error: 'Total milestone amount cannot exceed task price' },
        { status: 400 }
      )
    }

    // Create milestones
    const createdMilestones = await prisma.$transaction(
      milestones.map((milestone: any, index: number) =>
        prisma.paymentMilestone.create({
          data: {
            taskId: id,
            name: milestone.name,
            description: milestone.description,
            amount: milestone.amount,
            percentage: (milestone.amount / task.agreedPrice) * 100,
            order: index + 1,
            status: 'PENDING',
            dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: createdMilestones,
    })
  } catch (error: any) {
    console.error('Error creating milestones:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create milestones' },
      { status: 500 }
    )
  }
}
