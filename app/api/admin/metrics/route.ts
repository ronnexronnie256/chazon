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

    // Fetch all metrics in parallel
    const [
      totalUsers,
      totalStewards,
      totalClients,
      totalTasks,
      pendingTasks,
      activeTasks,
      completedTasks,
      transactions,
      pendingDisputes,
      pendingApplications
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STEWARD' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'OPEN' } }),
      prisma.task.count({ where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.task.count({ where: { status: 'DONE' } }),
      prisma.transaction.findMany({
        where: { type: 'CHARGE', status: 'COMPLETED' },
        select: { amount: true, platformFee: true }
      }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.stewardProfile.count({ where: { backgroundCheckStatus: 'PENDING' } })
    ])

    // Calculate revenue metrics
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0)
    const platformFees = transactions.reduce((sum, t) => sum + t.platformFee, 0)

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalStewards,
        totalClients,
        totalTasks,
        pendingTasks,
        activeTasks,
        completedTasks,
        totalRevenue,
        platformFees,
        pendingDisputes,
        pendingApplications
      }
    })
  } catch (error) {
    console.error('Error fetching admin metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

