import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'
import { initiatePayment } from '@/lib/flutterwave'

/**
 * PATCH /api/tasks/[id]/milestones/[milestoneId]
 * Update milestone status or pay milestone
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id, milestoneId } = await params
    const body = await req.json()

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        client: true,
        milestones: true,
      },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    const milestone = await prisma.paymentMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        transactions: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    })

    if (!milestone || milestone.taskId !== id) {
      return NextResponse.json({ success: false, error: 'Milestone not found' }, { status: 404 })
    }

    // Check authorization
    const isClient = task.clientId === user.id
    const isSteward = task.stewardId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isClient && !isSteward && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { action } = body

    if (action === 'pay') {
      // Client initiates payment for milestone
      if (!isClient && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Only clients can pay milestones' },
          { status: 403 }
        )
      }

      // Check if milestone is already paid
      if (milestone.status === 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Milestone is already paid' },
          { status: 400 }
        )
      }

      // Check if there's already a pending or completed transaction
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          milestoneId: milestoneId,
          status: { in: ['PENDING', 'COMPLETED'] },
        },
      })

      if (existingTransaction) {
        if (existingTransaction.status === 'COMPLETED') {
          return NextResponse.json(
            { success: false, error: 'Milestone is already paid' },
            { status: 400 }
          )
        }
        // Return existing payment link if pending
        return NextResponse.json({
          success: true,
          data: {
            transactionId: existingTransaction.id,
            message: 'Payment already initiated',
          },
        })
      }

      // Create transaction record
      const platformFee = milestone.amount * 0.1 // 10% platform fee
      const transaction = await prisma.transaction.create({
        data: {
          taskId: id,
          milestoneId: milestoneId,
          amount: milestone.amount,
          platformFee,
          type: 'CHARGE',
          status: 'PENDING',
          metadata: {
            currency: task.currency,
            milestoneName: milestone.name,
          },
        },
      })

      // Initiate payment with Flutterwave
      const url = new URL(req.url)
      const baseUrl = `${url.protocol}//${url.host}`
      const redirectUrl = `${baseUrl}/api/payments/verify?milestoneId=${milestoneId}`

      const flwResponse = await initiatePayment({
        tx_ref: transaction.id,
        amount: milestone.amount.toString(),
        currency: task.currency,
        redirect_url: redirectUrl,
        customer: {
          email: task.client.email || task.client.phone || 'client@example.com',
          name: task.client.name || 'Client',
        },
        customizations: {
          title: 'Chazon Milestone Payment',
          description: `Payment for milestone: ${milestone.name}`,
          logo: 'https://chazon.com/logo.png',
        },
      })

      if (flwResponse.status === 'success' && flwResponse.data?.link) {
        return NextResponse.json({
          success: true,
          data: {
            transactionId: transaction.id,
            paymentLink: flwResponse.data.link,
          },
        })
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to initiate payment' },
          { status: 500 }
        )
      }
    } else if (action === 'complete') {
      // Steward marks milestone as complete
      if (!isSteward && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Only stewards can mark milestones as complete' },
          { status: 403 }
        )
      }

      // Check if milestone is paid
      const paidTransaction = milestone.transactions.find((t) => t.status === 'COMPLETED')
      if (!paidTransaction) {
        return NextResponse.json(
          { success: false, error: 'Milestone must be paid before it can be marked as complete' },
          { status: 400 }
        )
      }

      // Update milestone status
      const updatedMilestone = await prisma.paymentMilestone.update({
        where: { id: milestoneId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        data: updatedMilestone,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error updating milestone:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update milestone' },
      { status: 500 }
    )
  }
}
