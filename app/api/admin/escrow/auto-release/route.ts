import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { $Enums } from '@prisma/client'
import { requireRole } from '@/lib/supabase/auth'

export async function POST(req: NextRequest) {
  try {
    await requireRole('ADMIN')

    const hoursParam = new URL(req.url).searchParams.get('hours')
    const hours = parseInt(hoursParam || process.env.ESCROW_AUTO_RELEASE_HOURS || '24')
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Find HELD charge transactions eligible for auto-release
    const heldCharges = await prisma.transaction.findMany({
      where: {
        type: 'CHARGE',
        status: $Enums.TransactionStatus.HELD,
        createdAt: { lte: cutoff },
        task: { status: 'DONE' },
      },
      include: { task: true },
    })

    let releasedCount = 0
    for (const tx of heldCharges) {
      const charges = await prisma.transaction.findMany({
        where: { taskId: tx.taskId, type: 'CHARGE', status: $Enums.TransactionStatus.HELD },
      })
      if (charges.length !== 1) {
        console.error('Escrow integrity violation: invalid CHARGE count', { taskId: tx.taskId, count: charges.length })
        await prisma.securityEvent.create({
          data: {
            type: 'ESCROW_INTEGRITY_VIOLATION',
            details: { taskId: tx.taskId, count: charges.length, action: 'auto_release', txId: tx.id },
          },
        }).catch(() => {})
        continue
      }
      const payoutAmount = tx.amount - tx.platformFee
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: tx.id },
          data: { status: $Enums.TransactionStatus.RELEASED, metadata: { ...(tx.metadata as any), autoRelease: true } },
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
              autoRelease: true,
              releasedAt: new Date().toISOString(),
            },
          },
        }),
        prisma.task.update({
          where: { id: tx.taskId },
          data: { status: $Enums.TaskStatus.DONE },
        }),
      ])
      releasedCount++
    }

    return NextResponse.json({ success: true, released: releasedCount })
  } catch (error: any) {
    console.error('Error running auto-release:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to auto-release escrow' },
      { status: 500 }
    )
  }
}
