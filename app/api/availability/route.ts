import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/availability
 * Get all availability slots for the current steward
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get steward profile
    const stewardProfile = await prisma.stewardProfile.findUnique({
      where: { userId: user.id },
    })

    if (!stewardProfile) {
      return NextResponse.json(
        { success: false, error: 'Steward profile not found' },
        { status: 404 }
      )
    }

    const availabilitySlots = await prisma.availabilitySlot.findMany({
      where: { stewardId: stewardProfile.id },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: availabilitySlots,
    })
  } catch (error: any) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/availability
 * Create a new availability slot
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get steward profile
    const stewardProfile = await prisma.stewardProfile.findUnique({
      where: { userId: user.id },
    })

    if (!stewardProfile) {
      return NextResponse.json(
        { success: false, error: 'Steward profile not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { dayOfWeek, startTime, endTime, isRecurring, specificDate } = body

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'dayOfWeek, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    // Validate dayOfWeek (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { success: false, error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { success: false, error: 'startTime and endTime must be in HH:MM format' },
        { status: 400 }
      )
    }

    // Validate startTime < endTime
    if (startTime >= endTime) {
      return NextResponse.json(
        { success: false, error: 'startTime must be before endTime' },
        { status: 400 }
      )
    }

    // Check for overlapping slots
    const existingSlots = await prisma.availabilitySlot.findMany({
      where: {
        stewardId: stewardProfile.id,
        dayOfWeek,
        isRecurring: isRecurring !== false, // Default to true
      },
    })

    // Check for time overlaps
    for (const slot of existingSlots) {
      if (
        (startTime >= slot.startTime && startTime < slot.endTime) ||
        (endTime > slot.startTime && endTime <= slot.endTime) ||
        (startTime <= slot.startTime && endTime >= slot.endTime)
      ) {
        return NextResponse.json(
          { success: false, error: 'This time slot overlaps with an existing availability slot' },
          { status: 400 }
        )
      }
    }

    const availabilitySlot = await prisma.availabilitySlot.create({
      data: {
        stewardId: stewardProfile.id,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        isRecurring: isRecurring !== false, // Default to true
        specificDate: specificDate ? new Date(specificDate) : null,
      },
    })

    return NextResponse.json({
      success: true,
      data: availabilitySlot,
    })
  } catch (error: any) {
    console.error('Error creating availability slot:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create availability slot' },
      { status: 500 }
    )
  }
}
