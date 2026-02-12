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
    if (!admin) { // requireRole throws, but strict check doesn't hurt
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

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

    if (stewardProfile.status === 'APPROVED') {
        return NextResponse.json(
            { success: false, error: 'Steward is already approved' },
            { status: 400 }
        )
    }

    // Approve logic
    const [updatedProfile, updatedUser] = await prisma.$transaction([
      prisma.stewardProfile.update({
        where: { id },
        data: {
          status: 'APPROVED',
          backgroundCheckStatus: 'CLEARED', // Assume approval implies cleared check for now
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          approvedMetadata: {
            idVerified: true,
            backgroundCheck: 'basic',
            insuranceProvided: false,
            approvedUnderPolicy: 'v1',
          },
        },
      }),
      prisma.user.update({
        where: { id: stewardProfile.userId },
        data: {
          role: 'STEWARD',
        },
      }),
    ])

    // Send notification (placeholder logic)
    await prisma.notification.create({
        data: {
            userId: stewardProfile.userId,
            type: 'MESSAGE_RECEIVED', // Using generic type for now
            title: 'Application Approved',
            message: 'Congratulations! Your application to become a steward has been approved.',
        }
    })

    return NextResponse.json({ success: true, data: updatedProfile })
  } catch (error: any) {
    console.error('Error approving steward:', error)
    if (error.message?.includes('Unauthorized')) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }
    return NextResponse.json(
      { success: false, error: 'Failed to approve steward' },
      { status: 500 }
    )
  }
}
