import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    await requireRole('ADMIN')

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // 'OPEN', 'UNDER_REVIEW', 'RESOLVED'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          task: {
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
              }
            }
          },
          opener: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.dispute.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: disputes,
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
    console.error('Error fetching disputes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch disputes' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    await requireRole('ADMIN')

    const body = await req.json()
    const { disputeId, status, resolution } = body

    if (!disputeId || !status) {
      return NextResponse.json(
        { success: false, error: 'Dispute ID and status are required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (resolution) {
      updateData.resolution = resolution
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: updateData,
      include: {
        task: {
          include: {
            client: true,
            steward: true
          }
        },
        opener: true
      }
    })

    // If dispute is resolved, unfreeze any frozen payouts for this task
    if (status === 'RESOLVED') {
      // The wallet system will automatically recalculate balances
      // when it checks for disputed tasks
    }

    return NextResponse.json({
      success: true,
      data: updatedDispute
    })
  } catch (error) {
    console.error('Error updating dispute:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update dispute' },
      { status: 500 }
    )
  }
}
