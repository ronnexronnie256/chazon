import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const applySchema = z.object({
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  yearsOfExperience: z.number().min(0),
  languages: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = applySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      )
    }

    const { bio, skills, yearsOfExperience, languages } = result.data

    // Check if profile already exists
    const existingProfile = await prisma.stewardProfile.findUnique({
      where: { userId: user.id },
    })

    if (existingProfile) {
      if (existingProfile.status === 'APPROVED') {
        return NextResponse.json(
          { success: false, error: 'You are already an approved steward' },
          { status: 400 }
        )
      }
      if (existingProfile.status === 'SUSPENDED') {
        return NextResponse.json(
          { success: false, error: 'Your account is suspended. Please contact support.' },
          { status: 403 }
        )
      }
      
      // Update existing application
      const updatedProfile = await prisma.stewardProfile.update({
        where: { userId: user.id },
        data: {
          bio,
          skills,
          yearsOfExperience,
          languages: languages || [],
          status: 'APPLIED', // Re-apply if rejected or updating
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, data: updatedProfile })
    }

    // Create new profile
    const newProfile = await prisma.stewardProfile.create({
      data: {
        userId: user.id,
        bio,
        skills,
        yearsOfExperience,
        languages: languages || [],
        status: 'APPLIED',
        backgroundCheckStatus: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, data: newProfile })
  } catch (error: any) {
    console.error('Error applying for steward:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
