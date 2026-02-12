import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const body = await req.json().catch(() => ({}))
    const reason = body?.reason || 'Client dispute'

    const task = await prisma.task.findUnique({
      where: { id },
      include: { transactions: true },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    if (task.clientId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only the client can raise a dispute' },
        { status: 403 }
      )
    }

    const escrowTx = task.transactions.find(
      (t) => t.type === 'CHARGE' && t.status === 'HELD'
    )
    if (!escrowTx) {
      return NextResponse.json(
        { success: false, error: 'Dispute can only be raised while funds are held' },
        { status: 400 }
      )
    }

    // Atomic transition: mark transaction disputed, task disputed, and log admin notification
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: escrowTx.id },
        data: { status: 'DISPUTED' },
      }),
      prisma.task.update({
        where: { id: task.id },
        data: { status: 'DISPUTED' },
      }),
      prisma.securityEvent.create({
        data: {
          userId: user.id,
          type: 'DISPUTE_OPENED',
          details: {
            taskId: task.id,
            transactionId: escrowTx.id,
            reason,
          },
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error raising dispute:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to raise dispute' },
      { status: 500 }
    )
  }
}
