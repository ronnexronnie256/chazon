/**
 * Pricing calculation utilities
 * Handles pricing rules: urgency, weekend, night multipliers and promo code discounts
 * PRD 6.5
 */

export interface PricingRule {
  urgencyMultiplier?: number
  weekendMultiplier?: number
  nightMultiplier?: number
}

export interface PricingContext {
  basePrice: number
  scheduledStart: Date
  isUrgentFlag?: boolean  // Renamed to avoid conflict with isUrgent function
  pricingRules?: PricingRule
}

export interface DiscountInfo {
  discountAmount: number
  discountType: 'PERCENTAGE' | 'FIXED'
  finalPrice: number
}

/**
 * Check if a date is on a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

/**
 * Check if a date/time is during night hours (8 PM - 6 AM)
 */
export function isNightTime(date: Date): boolean {
  const hour = date.getHours()
  return hour >= 20 || hour < 6 // 8 PM (20:00) to 6 AM (06:00)
}

/**
 * Check if a task is urgent (scheduled within 24 hours)
 */
export function isUrgent(scheduledStart: Date): boolean {
  const now = new Date()
  const hoursUntilStart = (scheduledStart.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilStart <= 24 && hoursUntilStart >= 0
}

/**
 * Calculate adjusted price based on pricing rules
 */
export function calculateAdjustedPrice(context: PricingContext): {
  basePrice: number
  adjustedPrice: number
  urgencyApplied: boolean
  weekendApplied: boolean
  nightApplied: boolean
  adjustments: Array<{ type: string; multiplier: number; amount: number }>
} {
  const { basePrice, scheduledStart, isUrgentFlag, pricingRules } = context

  const urgencyMultiplier = pricingRules?.urgencyMultiplier ?? 1.0
  const weekendMultiplier = pricingRules?.weekendMultiplier ?? 1.0
  const nightMultiplier = pricingRules?.nightMultiplier ?? 1.0

  let adjustedPrice = basePrice
  const adjustments: Array<{ type: string; multiplier: number; amount: number }> = []

  // Apply urgency multiplier if task is urgent
  // Use provided isUrgentFlag, or calculate it using isUrgent function if not provided
  const taskIsUrgent = isUrgentFlag !== undefined ? isUrgentFlag : isUrgent(scheduledStart)
  if (taskIsUrgent && urgencyMultiplier > 1.0) {
    const beforeUrgency = adjustedPrice
    adjustedPrice *= urgencyMultiplier
    adjustments.push({
      type: 'urgency',
      multiplier: urgencyMultiplier,
      amount: adjustedPrice - beforeUrgency,
    })
  }

  // Apply weekend multiplier if task is on weekend
  if (isWeekend(scheduledStart) && weekendMultiplier > 1.0) {
    const beforeWeekend = adjustedPrice
    adjustedPrice *= weekendMultiplier
    adjustments.push({
      type: 'weekend',
      multiplier: weekendMultiplier,
      amount: adjustedPrice - beforeWeekend,
    })
  }

  // Apply night multiplier if task is during night hours
  if (isNightTime(scheduledStart) && nightMultiplier > 1.0) {
    const beforeNight = adjustedPrice
    adjustedPrice *= nightMultiplier
    adjustments.push({
      type: 'night',
      multiplier: nightMultiplier,
      amount: adjustedPrice - beforeNight,
    })
  }

  return {
    basePrice,
    adjustedPrice: Math.round(adjustedPrice * 100) / 100, // Round to 2 decimal places
    urgencyApplied: taskIsUrgent && urgencyMultiplier > 1.0,
    weekendApplied: isWeekend(scheduledStart) && weekendMultiplier > 1.0,
    nightApplied: isNightTime(scheduledStart) && nightMultiplier > 1.0,
    adjustments,
  }
}

/**
 * Calculate discount from promo code
 */
export function calculateDiscount(
  price: number,
  discountType: 'PERCENTAGE' | 'FIXED',
  discountValue: number,
  maxDiscount?: number,
  minAmount?: number
): DiscountInfo | null {
  // Check minimum amount requirement
  if (minAmount && price < minAmount) {
    return null
  }

  let discountAmount = 0

  if (discountType === 'PERCENTAGE') {
    discountAmount = (price * discountValue) / 100
    // Apply max discount limit if specified
    if (maxDiscount && discountAmount > maxDiscount) {
      discountAmount = maxDiscount
    }
  } else {
    // FIXED discount
    discountAmount = Math.min(discountValue, price) // Can't discount more than the price
  }

  const finalPrice = Math.max(0, price - discountAmount)

  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountType,
    finalPrice: Math.round(finalPrice * 100) / 100,
  }
}

/**
 * Calculate final price with all adjustments and discounts
 */
export function calculateFinalPrice(
  context: PricingContext,
  promoCodeDiscount?: DiscountInfo
): {
  basePrice: number
  adjustedPrice: number
  discountAmount: number
  finalPrice: number
  urgencyApplied: boolean
  weekendApplied: boolean
  nightApplied: boolean
  adjustments: Array<{ type: string; multiplier: number; amount: number }>
} {
  const pricingResult = calculateAdjustedPrice(context)
  const discountAmount = promoCodeDiscount?.discountAmount ?? 0
  const finalPrice = promoCodeDiscount?.finalPrice ?? pricingResult.adjustedPrice

  return {
    basePrice: pricingResult.basePrice,
    adjustedPrice: pricingResult.adjustedPrice,
    discountAmount,
    finalPrice,
    urgencyApplied: pricingResult.urgencyApplied,
    weekendApplied: pricingResult.weekendApplied,
    nightApplied: pricingResult.nightApplied,
    adjustments: pricingResult.adjustments,
  }
}

