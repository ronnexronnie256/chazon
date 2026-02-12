import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['CLIENT', 'STEWARD']).optional().default('CLIENT'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { name, email, password, role } = parsed.data

    const supabase = await createClient()

    // Check if user already exists in Prisma first (more reliable)
    const existingDbUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingDbUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    })

    if (authError) {
      console.error('Supabase signup error:', authError)
      return NextResponse.json(
        { success: false, error: authError.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // If we have a session, the user is automatically signed in
    // If not, email confirmation might be required
    const hasSession = !!authData.session

    // Wait a moment for database trigger to create user profile
    // Then fetch the user from Prisma
    await new Promise(resolve => setTimeout(resolve, 500))

    // Fetch user from Prisma (created by database trigger)
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: authData.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true,
        },
      })

      if (!dbUser) {
        // If trigger didn't create user, create it manually as fallback
        const fallbackUser = await prisma.user.create({
          data: {
            id: authData.user.id,
            name,
            email,
            password: '', // Supabase handles password
            role: role,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            createdAt: true,
          },
        })

        return NextResponse.json({
          success: true,
          data: fallbackUser,
          session: hasSession,
          requiresConfirmation: !hasSession,
        })
      }

      return NextResponse.json({
        success: true,
        data: dbUser,
        session: hasSession, // Indicate if user is automatically signed in
        requiresConfirmation: !hasSession, // Indicate if email confirmation is needed
      })
    } catch (dbError: any) {
      console.error('Database sync error:', dbError)
      
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'User already exists' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to sync user to database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
