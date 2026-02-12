import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/supabase/auth'
import { startOfWeek, endOfWeek, subWeeks, format, parseISO } from 'date-fns'

/**
 * GET /api/steward/analytics/weekly
 * Get weekly earnings breakdown for steward
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getUser()
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stewardProfile: true },
    })

    if (!user || !user.stewardProfile || user.role !== 'STEWARD') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const weeks = parseInt(searchParams.get('weeks') || '4') // Default to last 4 weeks

    const now = new Date()
    const weeklyReports = []

    for (let i = 0; i < weeks; i++) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }) // Monday
      const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 }) // Sunday

      // Get all completed payouts for this week
      const payouts = await prisma.transaction.findMany({
        where: {
          type: 'PAYOUT',
          status: 'COMPLETED',
          createdAt: {
            gte: weekStart,
            lte: weekEnd,
          },
          task: {
            stewardId: user.id,
          },
        },
        include: {
          task: {
            include: {
              client: true,
            },
          },
        },
      })

      // Get tips for this week
      const tips = await prisma.transaction.findMany({
        where: {
          type: 'TIP',
          status: 'COMPLETED',
          createdAt: {
            gte: weekStart,
            lte: weekEnd,
          },
          task: {
            stewardId: user.id,
          },
        },
      })

      const totalEarnings = payouts.reduce((sum, t) => sum + t.amount, 0)
      const totalTips = tips.reduce((sum, t) => sum + t.amount, 0)
      const completedTasks = payouts.length
      const tasksWithTips = tips.length

      weeklyReports.push({
        week: format(weekStart, 'yyyy-MM-dd'),
        weekLabel: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
        earnings: totalEarnings,
        tips: totalTips,
        total: totalEarnings + totalTips,
        completedTasks,
        tasksWithTips,
        currency: 'UGX',
      })
    }

    return NextResponse.json({
      success: true,
      data: weeklyReports.reverse(), // Most recent first
    })
  } catch (error) {
    console.error('Error fetching weekly reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch weekly reports' },
      { status: 500 }
    )
  }
}

