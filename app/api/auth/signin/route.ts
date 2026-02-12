import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = signinSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    const supabase = await createClient()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get user from Prisma to get role and other custom fields
    // SECURITY: Look up by ID from Supabase Auth, not email
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
      // User exists in Supabase but not in Prisma - sync it
      // This might happen for old accounts or direct DB manipulations
      const newUser = await prisma.user.create({
        data: {
          id: authData.user.id,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          email: authData.user.email!,
          // SECURITY: Default to CLIENT, do not trust metadata for role
          role: 'CLIENT',
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
        data: newUser,
      })
    }

    return NextResponse.json({
      success: true,
      data: dbUser,
    })
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
