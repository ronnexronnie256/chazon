import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/supabase/auth'
import { subDays } from 'date-fns'

/**
 * GET /api/steward/recommendations/skills
 * Get skill recommendations based on market demand
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

    // Get steward's current skills from services
    const currentServices = await prisma.serviceOffering.findMany({
      where: {
        stewardId: stewardProfile.id,
      },
      select: {
        category: true,
      },
    })

    const currentCategories = new Set(currentServices.map((s) => s.category))

    // Analyze market demand (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30)

    // Get all tasks created in the last 30 days
    const recentTasks = await prisma.task.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      select: {
        category: true,
        stewardId: true,
      },
    })

    // Count demand by category
    const categoryDemand: Record<string, { total: number; unassigned: number; avgPrice: number }> = {}

    for (const task of recentTasks) {
      if (!categoryDemand[task.category]) {
        categoryDemand[task.category] = { total: 0, unassigned: 0, avgPrice: 0 }
      }
      categoryDemand[task.category].total++
      if (!task.stewardId) {
        categoryDemand[task.category].unassigned++
      }
    }

    // Get average prices for each category
    const categoryPrices = await prisma.serviceOffering.groupBy({
      by: ['category'],
      _avg: {
        price: true,
      },
    })

    for (const catPrice of categoryPrices) {
      if (categoryDemand[catPrice.category]) {
        categoryDemand[catPrice.category].avgPrice = catPrice._avg.price || 0
      }
    }

    // Calculate recommendation scores
    const recommendations = Object.entries(categoryDemand)
      .filter(([category]) => !currentCategories.has(category)) // Only suggest categories steward doesn't have
      .map(([category, stats]) => {
        // Score based on: demand, unassigned tasks, and average price
        const demandScore = stats.total * 10 // Higher demand = higher score
        const opportunityScore = stats.unassigned * 15 // Unassigned tasks = opportunity
        const priceScore = stats.avgPrice / 1000 // Higher price = higher score
        const totalScore = demandScore + opportunityScore + priceScore

        return {
          category,
          demand: stats.total,
          unassignedTasks: stats.unassigned,
          averagePrice: Math.round(stats.avgPrice),
          score: Math.round(totalScore),
          reason: getRecommendationReason(stats),
        }
      })
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, 5) // Top 5 recommendations

    return NextResponse.json({
      success: true,
      data: recommendations,
    })
  } catch (error) {
    console.error('Error fetching skill recommendations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skill recommendations' },
      { status: 500 }
    )
  }
}

function getRecommendationReason(stats: { total: number; unassigned: number; avgPrice: number }): string {
  const reasons: string[] = []

  if (stats.unassigned > 5) {
    reasons.push(`High demand with ${stats.unassigned} unassigned tasks`)
  } else if (stats.total > 10) {
    reasons.push(`High market demand (${stats.total} tasks in last 30 days)`)
  }

  if (stats.avgPrice > 50000) {
    reasons.push(`Good earning potential (avg. ${Math.round(stats.avgPrice).toLocaleString()} UGX)`)
  }

  if (reasons.length === 0) {
    return 'Growing market opportunity'
  }

  return reasons.join(', ')
}

