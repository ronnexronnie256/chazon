import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/supabase/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
    
    try {
    const offering = await prisma.serviceOffering.findUnique({
      where: { id },
      include: {
        steward: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!offering) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    const service = {
      id: offering.id,
      title: offering.title,
      description: offering.description || '',
      price: offering.price,
      currency: offering.currency,
      duration: offering.duration,
      images: offering.images || [],
      urgencyMultiplier: offering.urgencyMultiplier ?? 1.0,
      weekendMultiplier: offering.weekendMultiplier ?? 1.0,
      nightMultiplier: offering.nightMultiplier ?? 1.0,
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
      },
    }

    return NextResponse.json({
      success: true,
      data: service,
    })
  } catch (error) {
    console.error('Failed to fetch service:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get the service to check ownership
    const service = await prisma.serviceOffering.findUnique({
      where: { id },
      include: {
        steward: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Check if user is the owner
    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    })

    if (!user || user.id !== service.steward.userId) {
      return NextResponse.json(
        { error: 'You can only edit your own services' },
        { status: 403 }
      )
    }

    // Validate images array
    const serviceImages = Array.isArray(images) ? images.slice(0, 10) : service.images

    // Update the service
    const updatedService = await prisma.serviceOffering.update({
      where: { id },
      data: {
        title: title || service.title,
        description: description !== undefined ? description : service.description,
        category: category || service.category,
        price: price !== undefined ? parseFloat(price) : service.price,
        currency: currency || service.currency,
        duration: duration !== undefined ? parseInt(duration) : service.duration,
        images: serviceImages,
        urgencyMultiplier:
          urgencyMultiplier !== undefined
            ? parseFloat(urgencyMultiplier)
            : service.urgencyMultiplier ?? 1.0,
        weekendMultiplier:
          weekendMultiplier !== undefined
            ? parseFloat(weekendMultiplier)
            : service.weekendMultiplier ?? 1.0,
        nightMultiplier:
          nightMultiplier !== undefined
            ? parseFloat(nightMultiplier)
            : service.nightMultiplier ?? 1.0,
      },
      include: {
        steward: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedService,
    })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authUser = await getUser()

    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the service to check ownership
    const service = await prisma.serviceOffering.findUnique({
      where: { id },
      include: {
        steward: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Check if user is the owner
    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    })

    if (!user || user.id !== service.steward.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own services' },
        { status: 403 }
      )
    }

    // Delete the service
    await prisma.serviceOffering.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
