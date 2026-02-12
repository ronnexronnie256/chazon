import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDiscount } from '@/lib/pricing'

/**
 * POST /api/promo-codes/validate
 * Validate a promo code and calculate discount
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, price } = body

    if (!code || !price) {
      return NextResponse.json(
        { success: false, error: 'Code and price are required' },
        { status: 400 }
      )
    }

    // Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!promoCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid promo code' },
        { status: 404 }
      )
    }

    // Check if promo code is active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { success: false, error: 'Promo code is not active' },
        { status: 400 }
      )
    }

    // Check validity dates
    const now = new Date()
    if (now < promoCode.validFrom) {
      return NextResponse.json(
        { success: false, error: 'Promo code is not yet valid' },
        { status: 400 }
      )
    }

    if (now > promoCode.validUntil) {
      return NextResponse.json(
        { success: false, error: 'Promo code has expired' },
        { status: 400 }
      )
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      return NextResponse.json(
        { success: false, error: 'Promo code usage limit reached' },
        { status: 400 }
      )
    }

    // Calculate discount
    const discountInfo = calculateDiscount(
      parseFloat(price),
      promoCode.discountType,
      promoCode.discountValue,
      promoCode.maxDiscount ?? undefined,
      promoCode.minAmount ?? undefined
    )

    if (!discountInfo) {
      return NextResponse.json(
        { success: false, error: 'Minimum order amount not met' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          description: promoCode.description,
        },
        discount: discountInfo,
      },
    })
  } catch (error: any) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to validate promo code' },
      { status: 500 }
    )
  }
}

