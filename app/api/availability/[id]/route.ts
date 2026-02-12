import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/availability/[id]
 * Update an availability slot
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    // Check if slot exists and belongs to this steward
    const existingSlot = await prisma.availabilitySlot.findUnique({
      where: { id },
    })

    if (!existingSlot) {
      return NextResponse.json(
        { success: false, error: 'Availability slot not found' },
        { status: 404 }
      )
    }

    if (existingSlot.stewardId !== stewardProfile.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { dayOfWeek, startTime, endTime, isRecurring, specificDate } = body

    // Validate time format if provided
    if (startTime || endTime) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
      if (startTime && !timeRegex.test(startTime)) {
        return NextResponse.json(
          { success: false, error: 'startTime must be in HH:MM format' },
          { status: 400 }
        )
      }
      if (endTime && !timeRegex.test(endTime)) {
        return NextResponse.json(
          { success: false, error: 'endTime must be in HH:MM format' },
          { status: 400 }
        )
      }

      // Validate startTime < endTime
      const finalStartTime = startTime || existingSlot.startTime
      const finalEndTime = endTime || existingSlot.endTime
      if (finalStartTime >= finalEndTime) {
        return NextResponse.json(
          { success: false, error: 'startTime must be before endTime' },
          { status: 400 }
        )
      }
    }

    // Check for overlapping slots (excluding current slot)
    if (dayOfWeek !== undefined || startTime || endTime) {
      const finalDayOfWeek = dayOfWeek !== undefined ? parseInt(dayOfWeek) : existingSlot.dayOfWeek
      const finalStartTime = startTime || existingSlot.startTime
      const finalEndTime = endTime || existingSlot.endTime
      const finalIsRecurring = isRecurring !== undefined ? isRecurring : existingSlot.isRecurring

      const existingSlots = await prisma.availabilitySlot.findMany({
        where: {
          stewardId: stewardProfile.id,
          dayOfWeek: finalDayOfWeek,
          isRecurring: finalIsRecurring,
          NOT: { id }, // Exclude current slot
        },
      })

      // Check for time overlaps
      for (const slot of existingSlots) {
        if (
          (finalStartTime >= slot.startTime && finalStartTime < slot.endTime) ||
          (finalEndTime > slot.startTime && finalEndTime <= slot.endTime) ||
          (finalStartTime <= slot.startTime && finalEndTime >= slot.endTime)
        ) {
          return NextResponse.json(
            { success: false, error: 'This time slot overlaps with an existing availability slot' },
            { status: 400 }
          )
        }
      }
    }

    const updatedSlot = await prisma.availabilitySlot.update({
      where: { id },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek: parseInt(dayOfWeek) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(specificDate !== undefined && { specificDate: specificDate ? new Date(specificDate) : null }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedSlot,
    })
  } catch (error: any) {
    console.error('Error updating availability slot:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update availability slot' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/availability/[id]
 * Delete an availability slot
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    // Check if slot exists and belongs to this steward
    const existingSlot = await prisma.availabilitySlot.findUnique({
      where: { id },
    })

    if (!existingSlot) {
      return NextResponse.json(
        { success: false, error: 'Availability slot not found' },
        { status: 404 }
      )
    }

    if (existingSlot.stewardId !== stewardProfile.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.availabilitySlot.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Availability slot deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting availability slot:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete availability slot' },
      { status: 500 }
    )
  }
}
