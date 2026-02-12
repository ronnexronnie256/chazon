import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { $Enums } from '@prisma/client'
import { requireRole } from '@/lib/supabase/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('ADMIN')
    const { id } = await params

    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { task: true },
    })
    if (
      !tx ||
      tx.type !== 'CHARGE' ||
      !(
        tx.status === $Enums.TransactionStatus.HELD ||
        tx.status === $Enums.TransactionStatus.DISPUTED
      )
    ) {
      return NextResponse.json(
        { success: false, error: 'Transaction must be a HELD/DISPUTED CHARGE' },
        { status: 400 }
      )
    }

    const payoutAmount = tx.amount - tx.platformFee

    // Escrow integrity: ensure exactly one HELD CHARGE exists for this task
    const charges = await prisma.transaction.findMany({
      where: { taskId: tx.taskId, type: 'CHARGE', status: $Enums.TransactionStatus.HELD },
    })
    if (charges.length !== 1) {
      console.error('Escrow integrity violation: invalid CHARGE count', { taskId: tx.taskId, count: charges.length })
      await prisma.securityEvent.create({
        data: {
          type: 'ESCROW_INTEGRITY_VIOLATION',
          details: { taskId: tx.taskId, count: charges.length, action: 'admin_release', txId: id },
        },
      }).catch(() => {})
      return NextResponse.json(
        { success: false, error: 'Escrow integrity violation: invalid CHARGE count' },
        { status: 400 }
      )
    }

    const [releasedTx, payoutTx] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id },
        data: { status: $Enums.TransactionStatus.RELEASED },
      }),
      prisma.transaction.create({
        data: {
          taskId: tx.taskId,
          clientId: tx.task?.clientId || undefined,
          stewardId: tx.task?.stewardId || undefined,
          amount: payoutAmount,
          platformFee: 0,
          type: 'PAYOUT',
          status: $Enums.TransactionStatus.COMPLETED,
          metadata: {
            originalChargeId: tx.id,
            releasedByAdmin: true,
            releasedAt: new Date().toISOString(),
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: { releasedTransactionId: releasedTx.id, payoutTransactionId: payoutTx.id },
    })
  } catch (error: any) {
    console.error('Error releasing escrow:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to release escrow' },
      { status: 500 }
    )
  }
}
