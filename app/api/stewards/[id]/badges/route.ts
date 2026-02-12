import { NextRequest, NextResponse } from 'next/server'
import { calculateStewardBadges } from '@/lib/badges'

/**
 * GET /api/stewards/[id]/badges
 * Get badges for a specific steward
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const badges = await calculateStewardBadges(id)

    return NextResponse.json({
      success: true,
      data: badges,
    })
  } catch (error: any) {
    console.error('Error fetching steward badges:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}

