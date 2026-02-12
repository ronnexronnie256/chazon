import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns'

interface TimeSeriesData {
  date: string
  users: number
  tasks: number
  revenue: number
  platformFees: number
}

export async function GET(req: Request) {
  try {
    await requireRole('ADMIN')

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30' // days, 7, 30, 90, 365
    const days = parseInt(period)

    // Calculate date range - include today
    // Get today at start of day (00:00:00) and end of day (23:59:59) in local timezone
    const today = new Date()
    const endDate = endOfDay(today) // Today at 23:59:59.999
    // Go back (days-1) days to get the start date, so we have exactly 'days' days including today
    // Example: If today is Dec 23 and days=30, we want Nov 24 to Dec 23 (30 days)
    const startDate = startOfDay(subDays(today, days - 1)) // Start of day (days-1) days ago
    
    // Generate all dates in the range (including today)
    const dateRange = eachDayOfInterval({
      start: startDate,
      end: today // Includes today
    })

    // Fetch time-series data
    const [users, tasks, transactions] = await Promise.all([
      // Users grouped by creation date
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true
        }
      }),
      // Tasks grouped by creation date
      prisma.task.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          status: true
        }
      }),
      // Transactions grouped by creation date
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          type: 'CHARGE',
          status: 'COMPLETED'
        },
        select: {
          createdAt: true,
          amount: true,
          platformFee: true
        }
      })
    ])

    // Group data by date
    const dataMap = new Map<string, TimeSeriesData>()

    // Initialize all dates in range (including today)
    dateRange.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd') // Use local date format
      dataMap.set(dateKey, {
        date: dateKey,
        users: 0,
        tasks: 0,
        revenue: 0,
        platformFees: 0
      })
    })

    // Aggregate users - use local date for grouping
    users.forEach(user => {
      // Convert UTC date to local date string
      const localDate = new Date(user.createdAt)
      const dateKey = format(localDate, 'yyyy-MM-dd')
      const existing = dataMap.get(dateKey)
      if (existing) {
        existing.users += 1
      }
    })

    // Aggregate tasks - use local date for grouping
    tasks.forEach(task => {
      // Convert UTC date to local date string
      const localDate = new Date(task.createdAt)
      const dateKey = format(localDate, 'yyyy-MM-dd')
      const existing = dataMap.get(dateKey)
      if (existing) {
        existing.tasks += 1
      }
    })

    // Aggregate transactions - use local date for grouping
    transactions.forEach(transaction => {
      // Convert UTC date to local date string
      const localDate = new Date(transaction.createdAt)
      const dateKey = format(localDate, 'yyyy-MM-dd')
      const existing = dataMap.get(dateKey)
      if (existing) {
        existing.revenue += transaction.amount
        existing.platformFees += transaction.platformFee
      }
    })

    // Convert to array and sort by date
    const timeSeriesData = Array.from(dataMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    // Calculate summary statistics
    const totalUsers = users.length
    const totalTasks = tasks.length
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0)
    const totalPlatformFees = transactions.reduce((sum, t) => sum + t.platformFee, 0)
    const completedTasks = tasks.filter(t => t.status === 'DONE').length
    const activeTasks = tasks.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length

    // Calculate growth rates (compare first half vs second half of period)
    const midpoint = Math.floor(days / 2)
    const firstHalf = timeSeriesData.slice(0, midpoint)
    const secondHalf = timeSeriesData.slice(midpoint)

    const firstHalfUsers = firstHalf.reduce((sum, d) => sum + d.users, 0)
    const secondHalfUsers = secondHalf.reduce((sum, d) => sum + d.users, 0)
    const userGrowthRate = firstHalfUsers > 0 
      ? ((secondHalfUsers - firstHalfUsers) / firstHalfUsers) * 100 
      : 0

    const firstHalfTasks = firstHalf.reduce((sum, d) => sum + d.tasks, 0)
    const secondHalfTasks = secondHalf.reduce((sum, d) => sum + d.tasks, 0)
    const taskGrowthRate = firstHalfTasks > 0 
      ? ((secondHalfTasks - firstHalfTasks) / firstHalfTasks) * 100 
      : 0

    const firstHalfRevenue = firstHalf.reduce((sum, d) => sum + d.revenue, 0)
    const secondHalfRevenue = secondHalf.reduce((sum, d) => sum + d.revenue, 0)
    const revenueGrowthRate = firstHalfRevenue > 0 
      ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        timeSeries: timeSeriesData,
        summary: {
          totalUsers,
          totalTasks,
          completedTasks,
          activeTasks,
          totalRevenue,
          totalPlatformFees,
          userGrowthRate: Math.round(userGrowthRate * 100) / 100,
          taskGrowthRate: Math.round(taskGrowthRate * 100) / 100,
          revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100
        },
        period: days
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
