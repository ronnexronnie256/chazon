import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { prisma } from '@/lib/prisma'
import { addHours } from 'date-fns'
import {
  calculateFinalPrice,
  isUrgent,
  type PricingContext,
} from '@/lib/pricing'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

// Helper to map Task to Booking
const mapTaskToBooking = (task: any) => {
  // Find completed CHARGE transaction (payment)
  const completedPayment = task.transactions?.find(
    (t: any) => t.type === 'CHARGE' && t.status === 'HELD'
  )
  
  // Find completed PAYOUT transaction (payment released to steward)
  const completedPayout = task.transactions?.find(
    (t: any) => t.type === 'PAYOUT' && t.status === 'COMPLETED'
  )
  
  // Check if payment has been made
  const isPaid = !!completedPayment
  // Check if payment has been released to steward
  const isPaymentReleased = !!completedPayout
  
  return {
    id: task.id,
    status: mapStatus(task.status),
    scheduledDate: task.scheduledStart.toISOString(),
    scheduledTime: task.scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    address: task.address,
    notes: task.description,
    stewardId: task.stewardId, // Include stewardId for role checking
    clientId: task.clientId, // Include clientId for role checking
    isPaid, // Payment status
    isPaymentReleased, // Whether payment has been released to steward
    paymentTransaction: completedPayment ? {
      id: completedPayment.id,
      amount: completedPayment.amount,
      currency: task.currency,
      paymentMethod: completedPayment.paymentMethod,
      completedAt: completedPayment.createdAt,
    } : null,
    payoutTransaction: completedPayout ? {
      id: completedPayout.id,
      amount: completedPayout.amount,
      releasedAt: completedPayout.createdAt,
    } : null,
    client: task.client ? {
      id: task.client.id,
      name: task.client.name,
      image: task.client.image,
    } : null,
    service: {
      id: task.id, // We don't have the original service ID in Task, using Task ID or leaving ambiguous
      title: task.category,
      description: task.description || "",
      price: task.agreedPrice,
      currency: task.currency,
      duration: 60, // Default
      images: task.steward?.image ? [task.steward.image] : [],
      category: { 
        id: task.category.toLowerCase(), 
        name: task.category, 
        slug: task.category.toLowerCase() 
      },
      steward: {
        id: task.steward?.id || '',
        name: task.steward?.name || '',
        image: task.steward?.image,
        rating: 0, // Placeholder
      }
    }
  }
}

const mapStatus = (status: string) => {
  switch (status) {
    case 'OPEN': return 'PENDING'
    case 'ASSIGNED': return 'CONFIRMED'
    case 'IN_PROGRESS': return 'IN_PROGRESS'
    case 'DONE': return 'COMPLETED'
    case 'CANCELLED': return 'CANCELLED'
    case 'EXPIRED': return 'EXPIRED'
    case 'DISPUTED': return 'DISPUTED'
    default: return 'PENDING'
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') // 'client' or 'steward'

    // Determine which tasks to fetch based on user role and query param
    let whereClause: any = {}

    if (role === 'steward' || user.role === 'STEWARD') {
      // For stewards, show:
      // 1. Tasks assigned to this steward
      // 2. Broadcast tasks (tasks without stewardId) that are OPEN and not expired
      whereClause = {
        OR: [
          { stewardId: user.id }, // Tasks assigned to this steward
          { 
            stewardId: null, // Broadcast tasks
            status: 'OPEN',
            isExpired: false
          }
        ]
      }
    } else {
      // Default: fetch tasks for client
      whereClause.clientId = user.id
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        steward: true,
        client: true,
        transactions: {
          where: {
            type: 'CHARGE', // Only get payment transactions
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: tasks.map(mapTaskToBooking),
      meta: {
        pagination: {
          page: 1,
          total: tasks.length,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Rate Limit Check
    const limitResult = await checkRateLimit(user.id, 'BOOKING')
    if (!limitResult.success) {
      // Log event
      try {
        const headersList = await headers()
        const ip = (headersList as any).get?.('x-forwarded-for') || '127.0.0.1'
        await prisma.securityEvent.create({
            data: {
                type: 'RATE_LIMIT_EXCEEDED_BOOKING',
                userId: user.id,
                ipAddress: ip,
                details: {
                    limit: limitResult.limit,
                    remaining: limitResult.remaining
                }
            }
        })
      } catch (e) { console.error(e) }

      return NextResponse.json(
        { success: false, error: 'Too many booking requests' },
        { status: 429 }
      )
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.scheduledDate || !body.address) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: scheduledDate and address are required' },
        { status: 400 }
      )
    }

    // Determine booking type (FR-10: Direct vs Broadcast)
    const bookingType = body.bookingType || 'DIRECT' // Default to direct booking
    const isBroadcast = bookingType === 'BROADCAST'

    let stewardId: string | null = null
    let category = body.category || ''
    let agreedPrice = body.agreedPrice || 0
    let currency = body.currency || 'UGX'
    let pricingType = body.pricingType || 'FLAT'

    let serviceOffering: any = null
    let basePrice = 0
    let pricingRules: any = null

    // For direct booking, require serviceId
    if (!isBroadcast) {
      if (!body.serviceId) {
        return NextResponse.json(
          { success: false, error: 'serviceId is required for direct booking' },
          { status: 400 }
        )
      }

      // Find the service offering to get details
      serviceOffering = await prisma.serviceOffering.findUnique({
        where: { id: body.serviceId },
        include: { steward: { include: { user: true } } }
      })

      if (!serviceOffering) {
        return NextResponse.json(
          { success: false, error: 'Service not found' },
          { status: 404 }
        )
      }

      stewardId = serviceOffering.steward.userId
      category = serviceOffering.category
      basePrice = serviceOffering.price
      currency = serviceOffering.currency
      pricingType = serviceOffering.pricingType
      pricingRules = {
        urgencyMultiplier: serviceOffering.urgencyMultiplier ?? 1.0,
        weekendMultiplier: serviceOffering.weekendMultiplier ?? 1.0,
        nightMultiplier: serviceOffering.nightMultiplier ?? 1.0,
      }
    } else {
      // For broadcast booking, require category and price
      if (!body.category || !body.agreedPrice) {
        return NextResponse.json(
          { success: false, error: 'category and agreedPrice are required for broadcast booking' },
          { status: 400 }
        )
      }
      category = body.category
      basePrice = body.agreedPrice
      currency = body.currency || 'UGX'
      pricingType = body.pricingType || 'FLAT'
      // Broadcast bookings don't have pricing rules (no service offering)
      pricingRules = {
        urgencyMultiplier: 1.0,
        weekendMultiplier: 1.0,
        nightMultiplier: 1.0,
      }
    }

    // Calculate scheduled start date/time
    const scheduledStart = new Date(body.scheduledDate)
    if (body.scheduledTime) {
      const [hours, minutes] = body.scheduledTime.split(':')
      scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }

    // Apply pricing rules (PRD 6.5)
    const pricingContext: PricingContext = {
      basePrice,
      scheduledStart,
      isUrgentFlag: body.isUrgent ?? isUrgent(scheduledStart),
      pricingRules,
    }

    const pricingResult = calculateFinalPrice(pricingContext)
    let adjustedPrice = pricingResult.adjustedPrice
    let discountAmount = 0
    let discountType: 'PERCENTAGE' | 'FIXED' | null = null
    let promoCodeId: string | null = null

    // Apply promo code discount if provided (PRD 6.5)
    if (body.promoCode) {
      const promoCode = await prisma.promoCode.findUnique({
        where: { code: body.promoCode.toUpperCase() },
      })

      if (promoCode && promoCode.isActive) {
        const now = new Date()
        if (now >= promoCode.validFrom && now <= promoCode.validUntil) {
          if (!promoCode.usageLimit || promoCode.usedCount < promoCode.usageLimit) {
            // Check minimum amount requirement
            if (!promoCode.minAmount || adjustedPrice >= promoCode.minAmount) {
              let calculatedDiscount = 0
              if (promoCode.discountType === 'PERCENTAGE') {
                calculatedDiscount = (adjustedPrice * promoCode.discountValue) / 100
                if (promoCode.maxDiscount && calculatedDiscount > promoCode.maxDiscount) {
                  calculatedDiscount = promoCode.maxDiscount
                }
              } else {
                calculatedDiscount = Math.min(promoCode.discountValue, adjustedPrice)
              }

              discountAmount = calculatedDiscount
              discountType = promoCode.discountType
              promoCodeId = promoCode.id
              adjustedPrice = Math.max(0, adjustedPrice - discountAmount)
            }
          }
        }
      }
    }

    // Final agreed price is the adjusted price after all rules and discounts
    agreedPrice = Math.round(adjustedPrice * 100) / 100

    // Calculate expiry date (FR-11: Task expiry logic)
    // Tasks expire 24 hours after creation if not accepted
    const expiresAt = addHours(new Date(), 24)

    const task = await prisma.task.create({
      data: {
        clientId: user.id,
        stewardId: stewardId, // null for broadcast booking
        category,
        description: body.notes || body.description || '',
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        agreedPrice, // Final price after all adjustments
        currency,
        pricingType,
        scheduledStart,
        scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
        bookingType: bookingType,
        expiresAt,
        status: 'OPEN',
        // Pricing adjustments (PRD 6.5)
        basePrice: pricingResult.basePrice,
        urgencyApplied: pricingResult.urgencyApplied,
        weekendApplied: pricingResult.weekendApplied,
        nightApplied: pricingResult.nightApplied,
        // Discount tracking (PRD 6.5)
        promoCodeId,
        discountAmount: discountAmount > 0 ? discountAmount : null,
        discountType: discountType,
      },
      include: {
        steward: true,
        client: true
      }
    })

    // Increment promo code usage count if used
    if (promoCodeId) {
      await prisma.promoCode.update({
        where: { id: promoCodeId },
        data: { usedCount: { increment: 1 } },
      })
    }

    return NextResponse.json({
      success: true,
      data: mapTaskToBooking(task),
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
