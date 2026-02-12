import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    await requireRole('ADMIN')

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // Task status filter
    const search = searchParams.get('search') // Search by category or description
    const clientId = searchParams.get('clientId')
    const stewardId = searchParams.get('stewardId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (clientId) {
      where.clientId = clientId
    }
    if (stewardId) {
      where.stewardId = stewardId
    }
    if (search) {
      where.OR = [
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          steward: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          transactions: {
            where: { type: 'CHARGE' },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: {
            select: {
              messages: true,
              reviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.task.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: tasks.map(t => ({
        id: t.id,
        status: t.status,
        category: t.category,
        description: t.description,
        address: t.address,
        agreedPrice: t.agreedPrice,
        currency: t.currency,
        scheduledStart: t.scheduledStart,
        scheduledEnd: t.scheduledEnd,
        actualStart: t.actualStart,
        actualEnd: t.actualEnd,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        client: t.client,
        steward: t.steward,
        payment: t.transactions[0] ? {
          status: t.transactions[0].status,
          amount: t.transactions[0].amount,
          completedAt: t.transactions[0].createdAt
        } : null,
        counts: {
          messages: t._count.messages,
          reviews: t._count.reviews
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
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
