import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/supabase/auth'

/**
 * GET /api/promo-codes
 * List all promo codes (admin only)
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promoCode.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: promoCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch promo codes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/promo-codes
 * Create a new promo code (admin only)
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      currency,
      minAmount,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive = true,
    } = body

    // Validation
    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (discountType === 'PERCENTAGE' && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount must be between 0 and 100' },
        { status: 400 }
      )
    }

    if (discountType === 'FIXED' && discountValue < 0) {
      return NextResponse.json(
        { success: false, error: 'Fixed discount must be positive' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Promo code already exists' },
        { status: 400 }
      )
    }

    // Validate dates
    const validFromDate = new Date(validFrom)
    const validUntilDate = new Date(validUntil)

    if (validUntilDate <= validFromDate) {
      return NextResponse.json(
        { success: false, error: 'Valid until date must be after valid from date' },
        { status: 400 }
      )
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        currency: currency || 'UGX',
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        validFrom: validFromDate,
        validUntil: validUntilDate,
        isActive,
      },
    })

    return NextResponse.json({
      success: true,
      data: promoCode,
    })
  } catch (error: any) {
    console.error('Error creating promo code:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create promo code' },
      { status: 500 }
    )
  }
}

