import { NextResponse } from 'next/server'
import { checkRateLimit, RateLimitType } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { identifier, type } = body as { identifier: string, type: RateLimitType }

    if (!identifier || !type) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    // Get IP for secondary identification (anonymous limiting)
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
    
    // Check rate limit
    const limitResult = await checkRateLimit(identifier, type)
    
    if (!limitResult.success) {
      // LOG SECURITY EVENT
      try {
        await prisma.securityEvent.create({
            data: {
                type: `RATE_LIMIT_EXCEEDED_${type}`,
                ipAddress: ip,
                details: {
                    identifier,
                    limit: limitResult.limit,
                    remaining: limitResult.remaining
                }
            }
        })
      } catch (logError) {
        console.error('Failed to log security event:', logError)
      }

      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Rate limit check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
