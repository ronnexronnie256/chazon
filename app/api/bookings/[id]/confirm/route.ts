import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { $Enums } from '@prisma/client'
import { getUser } from '@/lib/supabase/auth'

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

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    if (task.clientId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only the booking’s client can confirm completion' },
        { status: 403 }
      )
    }

    if (task.status !== 'DONE') {
      return NextResponse.json(
        { success: false, error: 'Task must be marked done by steward before confirmation' },
        { status: 400 }
      )
    }

    const charges = await prisma.transaction.findMany({
      where: { taskId: id, type: 'CHARGE', status: $Enums.TransactionStatus.HELD },
    })
    if (charges.length !== 1) {
      console.error('Escrow integrity violation: invalid CHARGE count', { taskId: id, count: charges.length })
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          type: 'ESCROW_INTEGRITY_VIOLATION',
          details: { taskId: id, count: charges.length, action: 'client_confirm' },
        },
      }).catch(() => {})
      return NextResponse.json(
        { success: false, error: 'Escrow integrity violation: invalid CHARGE count' },
        { status: 400 }
      )
    }
    const escrowTx = charges[0]

    // Calculate payout amount
    const payoutAmount = escrowTx.amount - escrowTx.platformFee

    // Atomic transition: release escrow, create payout, mark task completed
    const [releasedTx, payoutTx, updatedTask] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: escrowTx.id },
        data: { status: $Enums.TransactionStatus.RELEASED },
      }),
      prisma.transaction.create({
        data: {
          taskId: task.id,
          clientId: task.clientId,
          stewardId: task.stewardId || undefined,
          amount: payoutAmount,
          platformFee: 0,
          type: 'PAYOUT',
          status: $Enums.TransactionStatus.COMPLETED,
          metadata: {
            originalChargeId: escrowTx.id,
            releasedBy: user.id,
            releasedAt: new Date().toISOString(),
          },
        },
      }),
      prisma.task.update({
        where: { id: task.id },
        data: { status: $Enums.TaskStatus.DONE, actualEnd: task.actualEnd ?? new Date() },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        releasedTransactionId: releasedTx.id,
        payoutTransactionId: payoutTx.id,
        taskId: updatedTask.id,
        status: updatedTask.status,
      },
    })
  } catch (error: any) {
    console.error('Error confirming completion:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to confirm completion' },
      { status: 500 }
    )
  }
}
