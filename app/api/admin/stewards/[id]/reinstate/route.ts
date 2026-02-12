import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/supabase/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole('ADMIN')
    const { id } = await params

    const steward = await prisma.stewardProfile.findUnique({
      where: { id },
    })

    if (!steward) {
      return NextResponse.json({ error: 'Steward not found' }, { status: 404 })
    }

    if (steward.status !== 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Steward is not suspended' },
        { status: 400 }
      )
    }

    // Update status and log security event
    await prisma.$transaction([
      prisma.stewardProfile.update({
        where: { id },
        data: { status: 'APPROVED' },
      }),
      prisma.securityEvent.create({
        data: {
          type: 'STEWARD_REINSTATED',
          userId: admin.id,
          details: {
            stewardId: id,
            reason: 'Admin action',
            previousStatus: steward.status,
          },
        },
      }),
    ])

    return NextResponse.json({ success: true, message: 'Steward reinstated' })
  } catch (error: any) {
    console.error('Error reinstating steward:', error)
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
