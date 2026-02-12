import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/supabase/auth'

/**
 * GET /api/promo-codes/[id]
 * Get a specific promo code
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
    })

    if (!promoCode) {
      return NextResponse.json(
        { success: false, error: 'Promo code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: promoCode,
    })
  } catch (error) {
    console.error('Error fetching promo code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch promo code' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/promo-codes/[id]
 * Update a promo code (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUser()
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    // Check if promo code exists
    const existing = await prisma.promoCode.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Promo code not found' },
        { status: 404 }
      )
    }

    // Validate discount value if provided
    if (body.discountValue !== undefined) {
      if (body.discountType === 'PERCENTAGE' && (body.discountValue < 0 || body.discountValue > 100)) {
        return NextResponse.json(
          { success: false, error: 'Percentage discount must be between 0 and 100' },
          { status: 400 }
        )
      }

      if (body.discountType === 'FIXED' && body.discountValue < 0) {
        return NextResponse.json(
          { success: false, error: 'Fixed discount must be positive' },
          { status: 400 }
        )
      }
    }

    // Update promo code
    const updateData: any = {}
    if (body.description !== undefined) updateData.description = body.description
    if (body.discountType !== undefined) updateData.discountType = body.discountType
    if (body.discountValue !== undefined) updateData.discountValue = parseFloat(body.discountValue)
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.minAmount !== undefined) updateData.minAmount = body.minAmount ? parseFloat(body.minAmount) : null
    if (body.maxDiscount !== undefined) updateData.maxDiscount = body.maxDiscount ? parseFloat(body.maxDiscount) : null
    if (body.usageLimit !== undefined) updateData.usageLimit = body.usageLimit ? parseInt(body.usageLimit) : null
    if (body.validFrom !== undefined) updateData.validFrom = new Date(body.validFrom)
    if (body.validUntil !== undefined) updateData.validUntil = new Date(body.validUntil)
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: promoCode,
    })
  } catch (error: any) {
    console.error('Error updating promo code:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update promo code' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/promo-codes/[id]
 * Delete a promo code (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUser()
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if promo code exists
    const existing = await prisma.promoCode.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Promo code not found' },
        { status: 404 }
      )
    }

    await prisma.promoCode.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Promo code deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting promo code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete promo code' },
      { status: 500 }
    )
  }
}

