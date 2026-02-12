import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // 'PENDING', 'COMPLETED', 'FAILED'
    const stewardId = searchParams.get('stewardId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      type: 'PAYOUT'
    }
    if (status) {
      where.status = status
    }
    if (stewardId) {
      where.task = {
        stewardId
      }
    }

    const [payouts, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          task: {
            include: {
              steward: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              },
              client: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: payouts.map(p => ({
        id: p.id,
        taskId: p.taskId,
        amount: p.amount,
        status: p.status,
        paymentMethod: p.paymentMethod,
        providerTransactionId: p.providerTransactionId,
        metadata: p.metadata,
        createdAt: p.createdAt,
        task: {
          id: p.task.id,
          category: p.task.category,
          steward: p.task.steward,
          client: p.task.client
        }
      })),
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { payoutId, action, notes } = body

    if (!payoutId || !action) {
      return NextResponse.json(
        { success: false, error: 'Payout ID and action are required' },
        { status: 400 }
      )
    }

    const payout = await prisma.transaction.findUnique({
      where: { id: payoutId },
      include: { task: true }
    })

    if (!payout || payout.type !== 'PAYOUT') {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'approve':
        if (payout.status !== 'PENDING') {
          return NextResponse.json(
            { success: false, error: 'Only pending payouts can be approved' },
            { status: 400 }
          )
        }
        updateData.status = 'COMPLETED'
        if (notes) {
          updateData.metadata = {
            ...(payout.metadata as any || {}),
            adminNotes: notes,
            approvedBy: user.id,
            approvedAt: new Date().toISOString()
          }
        }
        break

      case 'reject':
        if (payout.status !== 'PENDING') {
          return NextResponse.json(
            { success: false, error: 'Only pending payouts can be rejected' },
            { status: 400 }
          )
        }
        updateData.status = 'FAILED'
        if (notes) {
          updateData.metadata = {
            ...(payout.metadata as any || {}),
            adminNotes: notes,
            rejectedBy: user.id,
            rejectedAt: new Date().toISOString()
          }
        }
        break

      case 'freeze':
        // Freeze payout (mark in metadata)
        updateData.metadata = {
          ...(payout.metadata as any || {}),
          frozen: true,
          frozenBy: user.id,
          frozenAt: new Date().toISOString(),
          freezeReason: notes || 'Admin freeze'
        }
        break

      case 'unfreeze':
        // Unfreeze payout
        const metadata = payout.metadata as any || {}
        delete metadata.frozen
        delete metadata.frozenBy
        delete metadata.frozenAt
        delete metadata.freezeReason
        updateData.metadata = metadata
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedPayout = await prisma.transaction.update({
      where: { id: payoutId },
      data: updateData,
      include: {
        task: {
          include: {
            steward: true,
            client: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedPayout
    })
  } catch (error) {
    console.error('Error updating payout:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update payout' },
      { status: 500 }
    )
  }
}

