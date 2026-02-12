import { NextRequest, NextResponse } from 'next/server'
import { getUser, requireRole } from '@/lib/supabase/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    const admin = await requireRole('ADMIN')

    const { id } = await params

    const stewardProfile = await prisma.stewardProfile.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!stewardProfile) {
      return NextResponse.json(
        { success: false, error: 'Steward profile not found' },
        { status: 404 }
      )
    }

    // Reject logic
    const [updatedProfile, updatedUser] = await prisma.$transaction([
      prisma.stewardProfile.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
      }),
      // Revert role to CLIENT if they were somehow a STEWARD
      prisma.user.update({
        where: { id: stewardProfile.userId },
        data: {
          role: 'CLIENT',
        },
      }),
    ])

    await prisma.notification.create({
        data: {
            userId: stewardProfile.userId,
            type: 'MESSAGE_RECEIVED',
            title: 'Application Update',
            message: 'Your application to become a steward has been reviewed and was not successful at this time.',
        }
    })

    return NextResponse.json({ success: true, data: updatedProfile })
  } catch (error: any) {
    console.error('Error rejecting steward:', error)
    if (error.message?.includes('Unauthorized')) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }
    return NextResponse.json(
      { success: false, error: 'Failed to reject steward' },
      { status: 500 }
    )
  }
}
