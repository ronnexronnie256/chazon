import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/supabase/auth'
import { subDays, subMonths } from 'date-fns'

/**
 * GET /api/steward/analytics/performance
 * Get performance insights for steward
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

    const stewardProfile = user.stewardProfile

    // Get all tasks for this steward
    const allTasks = await prisma.task.findMany({
      where: {
        stewardId: user.id,
      },
      include: {
        reviews: true,
        transactions: {
          where: {
            type: { in: ['PAYOUT', 'TIP'] },
            status: 'COMPLETED',
          },
        },
      },
    })

    // Calculate metrics
    const totalTasks = allTasks.length
    const completedTasks = allTasks.filter((t) => t.status === 'DONE').length
    const cancelledTasks = allTasks.filter((t) => t.status === 'CANCELLED').length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Average rating
    const allReviews = allTasks.flatMap((t) => t.reviews)
    const ratings = allReviews.filter((r) => r.revieweeId === user.id).map((r) => r.rating)
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0

    // Response time (time from task creation to acceptance)
    const acceptedTasks = allTasks.filter((t) => t.status !== 'OPEN')
    const responseTimes: number[] = []
    for (const task of acceptedTasks) {
      // Find when task was accepted (first status change from OPEN)
      const createdAt = task.createdAt.getTime()
      const updatedAt = task.updatedAt.getTime()
      // Approximate: use time between creation and first update
      const responseTime = (updatedAt - createdAt) / (1000 * 60 * 60) // Hours
      if (responseTime > 0 && responseTime < 168) {
        // Only count reasonable response times (< 7 days)
        responseTimes.push(responseTime)
      }
    }
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0

    // Earnings breakdown
    const totalEarnings = allTasks.reduce((sum, t) => {
      return sum + t.transactions.reduce((s, tx) => s + tx.amount, 0)
    }, 0)

    // Category performance
    const categoryStats: Record<string, { count: number; earnings: number; avgRating: number }> = {}
    for (const task of allTasks) {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = { count: 0, earnings: 0, avgRating: 0 }
      }
      categoryStats[task.category].count++
      categoryStats[task.category].earnings += task.transactions.reduce((sum, tx) => sum + tx.amount, 0)
      
      const categoryReviews = task.reviews.filter((r) => r.revieweeId === user.id)
      if (categoryReviews.length > 0) {
        const categoryRating = categoryReviews.reduce((sum, r) => sum + r.rating, 0) / categoryReviews.length
        categoryStats[task.category].avgRating = categoryRating
      }
    }

    // Recent performance (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30)
    const recentTasks = allTasks.filter((t) => t.createdAt >= thirtyDaysAgo)
    const recentCompleted = recentTasks.filter((t) => t.status === 'DONE').length
    const recentEarnings = recentTasks.reduce((sum, t) => {
      return sum + t.transactions.reduce((s, tx) => s + tx.amount, 0)
    }, 0)

    // Trends
    const threeMonthsAgo = subMonths(new Date(), 3)
    const oldTasks = allTasks.filter((t) => t.createdAt < threeMonthsAgo)
    const oldCompleted = oldTasks.filter((t) => t.status === 'DONE').length
    const oldEarnings = oldTasks.reduce((sum, t) => {
      return sum + t.transactions.reduce((s, tx) => s + tx.amount, 0)
    }, 0)

    const taskGrowth = oldCompleted > 0 ? ((recentCompleted - oldCompleted) / oldCompleted) * 100 : 0
    const earningsGrowth = oldEarnings > 0 ? ((recentEarnings - oldEarnings) / oldEarnings) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalTasks,
          completedTasks,
          cancelledTasks,
          completionRate: Math.round(completionRate * 100) / 100,
          averageRating: Math.round(averageRating * 100) / 100,
          avgResponseTimeHours: Math.round(avgResponseTime * 100) / 100,
          totalEarnings,
          currency: 'UGX',
        },
        categoryPerformance: Object.entries(categoryStats).map(([category, stats]) => ({
          category,
          taskCount: stats.count,
          earnings: stats.earnings,
          averageRating: Math.round(stats.avgRating * 100) / 100,
        })),
        trends: {
          taskGrowth: Math.round(taskGrowth * 100) / 100,
          earningsGrowth: Math.round(earningsGrowth * 100) / 100,
        },
        recentPerformance: {
          tasksCompleted: recentCompleted,
          earnings: recentEarnings,
          period: '30 days',
        },
      },
    })
  } catch (error) {
    console.error('Error fetching performance insights:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance insights' },
      { status: 500 }
    )
  }
}

