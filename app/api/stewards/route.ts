import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateStewardBadges } from '@/lib/badges'

/**
 * GET /api/stewards
 * Get featured stewards (public endpoint)
 * Query params: limit (default: 4), minRating (default: 4.0)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '4')
    const minRating = parseFloat(searchParams.get('minRating') || '4.0')
    const minCompletedTasks = parseInt(searchParams.get('minCompletedTasks') || '10')

    // Get featured stewards - only those with cleared background checks, good ratings, and some completed tasks
    const stewards = await prisma.stewardProfile.findMany({
      where: {
        status: 'APPROVED', // Only show verified stewards
        rating: {
          gte: minRating,
        },
        completedTasks: {
          gte: minCompletedTasks,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            city: true,
            address: true,
          },
        },
        services: {
          select: {
            id: true,
            category: true,
            price: true,
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { completedTasks: 'desc' },
      ],
      take: limit,
    })

    // Calculate badges and format response
    const formattedStewards = await Promise.all(
      stewards.map(async (steward) => {
        const badges = await calculateStewardBadges(steward.userId)
        
        // Calculate average hourly rate from services
        const avgRate = steward.services.length > 0
          ? Math.round(
              steward.services.reduce((sum, s) => sum + s.price, 0) / steward.services.length
            )
          : 0

        // Get top skills from steward's skills array
        const skills = steward.skills.slice(0, 3)

        // Calculate response time (simplified - could be enhanced with actual message data)
        // For now, we'll estimate based on acceptance rate
        const responseTime = steward.acceptanceRate >= 90 ? '30 mins' : steward.acceptanceRate >= 70 ? '1 hour' : '2 hours'

        // Get location
        const location = steward.user.city 
          ? `${steward.user.city}${steward.user.address ? `, ${steward.user.address}` : ''}`
          : steward.user.address || 'Kampala'

        return {
          id: steward.id,
          userId: steward.userId,
          name: steward.user.name,
          image: steward.user.image || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=150&h=150&fit=crop&q=60',
          rating: steward.rating,
          reviewCount: steward.completedTasks, // Using completed tasks as review count
          hourlyRate: avgRate || 150000, // Default to 150000 if no services
          location: location,
          skills: skills.length > 0 ? skills : ['General Services'],
          completedTasks: steward.completedTasks,
          responseTime: responseTime,
          isVerified: steward.backgroundCheckStatus === 'CLEARED',
          bio: steward.bio || 'Experienced steward ready to help with your needs.',
          badges: badges,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: formattedStewards,
    })
  } catch (error) {
    console.error('Error fetching featured stewards:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stewards' },
      { status: 500 }
    )
  }
}

