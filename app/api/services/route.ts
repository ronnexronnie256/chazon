import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getUser } from '@/lib/clerk/auth'
import { findMatchingStewards, markRecommended } from '@/lib/matching'
import { calculateStewardBadges } from '@/lib/badges'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const sortBy = searchParams.get('sortBy')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '9')
  const stewardId = searchParams.get('stewardId') // 'me' for current user, or specific steward ID
  
  // Smart matching parameters
  const clientLat = searchParams.get('latitude')
  const clientLng = searchParams.get('longitude')
  const scheduledStart = searchParams.get('scheduledStart')
  const maxDistance = searchParams.get('maxDistance')
  const useSmartMatching = searchParams.get('smartMatch') === 'true' || (clientLat && clientLng)

  const where: Prisma.ServiceOfferingWhereInput = {}

  // Filter by steward if requested
  if (stewardId) {
    if (stewardId === 'me') {
      // Get current user's steward profile
      const authUser = await getUser()
      if (authUser?.email) {
        const user = await prisma.user.findUnique({
          where: { email: authUser.email },
          include: { stewardProfile: true },
        })
        if (user?.stewardProfile) {
          where.stewardId = user.stewardProfile.id
        } else {
          // Not a steward, return empty
          return NextResponse.json({
            success: true,
            data: [],
            meta: {
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
              },
            },
          })
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      // Specific steward ID
      where.stewardId = stewardId
    }
  }

  if (category && category !== 'All') {
    where.category = {
      equals: category,
      mode: 'insensitive',
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (minPrice) {
    where.price = { 
      ...(where.price as Prisma.FloatFilter || {}), 
      gte: parseFloat(minPrice) 
    }
  }

  if (maxPrice) {
    where.price = { 
      ...(where.price as Prisma.FloatFilter || {}), 
      lte: parseFloat(maxPrice) 
    }
  }

  // Ensure only approved stewards are shown
  where.steward = {
    is: {
      status: 'APPROVED'
    }
  }

  const orderBy: Prisma.ServiceOfferingOrderByWithRelationInput = {}
  if (sortBy) {
    const [field, order] = sortBy.split(':')
    if (field === 'price') {
      orderBy.price = order === 'asc' ? 'asc' : 'desc'
    }
  } else {
    orderBy.createdAt = 'desc'
  }

  try {
    let services: any[] = []
    let total = 0

    // Use smart matching if location is provided
    if (useSmartMatching && clientLat && clientLng) {
      // Build matching options
      const matchingOptions: any = {
        category: category && category !== 'All' ? category : undefined,
        search: search || undefined,
        clientLatitude: parseFloat(clientLat),
        clientLongitude: parseFloat(clientLng),
        scheduledStart: scheduledStart ? new Date(scheduledStart) : undefined,
        maxDistance: maxDistance ? parseFloat(maxDistance) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      }

      const matches = await findMatchingStewards(matchingOptions)

      // Mark top 3 as recommended
      const recommendedMatches = markRecommended(matches, 3)
      
      // Get service IDs from matches
      const serviceIds = recommendedMatches.map(m => m.serviceId)
      
      // Fetch full service offerings for matched services
      const matchedOfferings = await prisma.serviceOffering.findMany({
        where: {
          ...where,
          id: { in: serviceIds },
        },
        include: {
          steward: {
            include: {
              user: true,
            },
          },
        },
      })

      // Create a map of matches by serviceId
      const matchMap = new Map(recommendedMatches.map(m => [m.serviceId, m]))

      // Sort offerings by match score
      matchedOfferings.sort((a, b) => {
        const scoreA = matchMap.get(a.id)?.score || 0
        const scoreB = matchMap.get(b.id)?.score || 0
        return scoreB - scoreA
      })

      // Apply pagination
      total = matchedOfferings.length
      const paginatedOfferings = matchedOfferings.slice((page - 1) * limit, page * limit)

      // Fetch badges for all stewards in parallel
      const stewardIds = paginatedOfferings.map(o => o.steward.userId)
      const badgesPromises = stewardIds.map(userId => calculateStewardBadges(userId))
      const badgesResults = await Promise.all(badgesPromises)
      const badgesMap = new Map(stewardIds.map((id, i) => [id, badgesResults[i]]))

      services = paginatedOfferings.map((offering) => {
        const match = matchMap.get(offering.id)
        const badges = badgesMap.get(offering.steward.userId) || []
        return {
          id: offering.id,
          title: offering.title,
          description: offering.description || '',
          price: offering.price,
          currency: offering.currency,
          duration: offering.duration,
          images: offering.images.length > 0 ? offering.images : ['https://images.unsplash.com/photo-1581578731117-104f8a338e2d?w=800&q=80'],
          category: {
            id: offering.category.toLowerCase(),
            name: offering.category.charAt(0).toUpperCase() + offering.category.slice(1),
            slug: offering.category.toLowerCase(),
          },
          steward: {
            id: offering.steward.id,
            userId: offering.steward.userId, // Add userId for fetching reviews
            name: offering.steward.user.name,
            image: offering.steward.user.image,
            rating: offering.steward.rating,
            totalReviews: offering.steward.completedTasks,
            bio: offering.steward.bio,
            badges: badges,
          },
          matchScore: match?.score,
          distance: match?.distance,
          isAvailable: match?.isAvailable,
          isRecommended: match?.isRecommended || false,
          matchReasons: match?.reasons || [],
        }
      })
    } else {
      // Standard query without smart matching
      const [totalCount, offerings] = await Promise.all([
        prisma.serviceOffering.count({ where }),
        prisma.serviceOffering.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            steward: {
              include: {
                user: true,
              },
            },
          },
        }),
      ])

      total = totalCount

      // Fetch badges for all stewards in parallel
      const stewardIds = offerings.map(o => o.steward.userId)
      const badgesPromises = stewardIds.map(userId => calculateStewardBadges(userId))
      const badgesResults = await Promise.all(badgesPromises)
      const badgesMap = new Map(stewardIds.map((id, i) => [id, badgesResults[i]]))

      services = offerings.map((offering) => {
        const badges = badgesMap.get(offering.steward.userId) || []
        return {
          id: offering.id,
          title: offering.title,
          description: offering.description || '',
          price: offering.price,
          currency: offering.currency,
          duration: offering.duration,
          images: offering.images.length > 0 ? offering.images : ['https://images.unsplash.com/photo-1581578731117-104f8a338e2d?w=800&q=80'],
          category: {
            id: offering.category.toLowerCase(),
            name: offering.category.charAt(0).toUpperCase() + offering.category.slice(1),
            slug: offering.category.toLowerCase(),
          },
          steward: {
            id: offering.steward.id,
            userId: offering.steward.userId, // Add userId for fetching reviews
            name: offering.steward.user.name,
            image: offering.steward.user.image,
            rating: offering.steward.rating,
            totalReviews: offering.steward.completedTasks,
            bio: offering.steward.bio,
            badges: badges,
          },
          isRecommended: false,
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: services,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        success: false, 
        error: process.env.NODE_ENV === 'development' ? `Failed to fetch services: ${errorMessage}` : 'Failed to fetch services' 
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getUser()
    
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      description,
      category,
      price,
      duration,
      currency,
      images,
      urgencyMultiplier,
      weekendMultiplier,
      nightMultiplier,
    } = body

    if (!title || !category || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stewardProfile: true },
    })

    if (!user || !user.stewardProfile) {
      return NextResponse.json({ error: 'You must be a steward to create services' }, { status: 403 })
    }

    // Validate images array
    const serviceImages = Array.isArray(images) ? images.slice(0, 10) : [] // Max 10 images

    const service = await prisma.serviceOffering.create({
      data: {
        stewardId: user.stewardProfile.id,
        title,
        description,
        category,
        price: parseFloat(price),
        currency: currency || 'UGX',
        duration: parseInt(duration) || 60,
        images: serviceImages,
        urgencyMultiplier: urgencyMultiplier ? parseFloat(urgencyMultiplier) : 1.0,
        weekendMultiplier: weekendMultiplier ? parseFloat(weekendMultiplier) : 1.0,
        nightMultiplier: nightMultiplier ? parseFloat(nightMultiplier) : 1.0,
      },
    })

    return NextResponse.json({
      success: true,
      data: service,
    })

  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
