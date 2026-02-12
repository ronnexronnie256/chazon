import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Create a new ratelimiter, that'll be used to limit requests
// The limiter is a "sliding window" limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export type RateLimitType = 'OTP' | 'AUTH_CHECK' | 'API' | 'BOOKING'

// Configuration for different rate limits
const LIMIT_CONFIGS = {
  // 3 OTPs per 10 minutes (prevents SMS flooding)
  OTP: { requests: 3, window: '10 m' },
  // 10 auth checks per minute (prevents login brute force)
  AUTH_CHECK: { requests: 10, window: '1 m' },
  // 60 API calls per minute (general API protection)
  API: { requests: 60, window: '1 m' },
  // 5 bookings per hour (prevents booking spam)
  BOOKING: { requests: 5, window: '1 h' },
} as const

export async function checkRateLimit(identifier: string, type: RateLimitType) {
  // If no Redis creds (dev mode), skip limiting or implement memory fallback
  // For this implementation, we'll assume Redis is configured or return success if not
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.warn('Rate limiting disabled: UPSTASH_REDIS_REST_URL not set')
    return { success: true, reset: 0, remaining: 100 }
  }

  const config = LIMIT_CONFIGS[type]
  
  // Create a new ratelimiter for this specific type
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window as any),
    analytics: true,
    prefix: `@upstash/ratelimit/${type}`,
  })

  // Use the identifier (IP or User ID) to check limits
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

  return { success, limit, reset, remaining }
}
