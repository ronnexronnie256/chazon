import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()

    if (error || !supabaseUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user exists in Prisma
    let dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id }
    })

    // If not, create them
    if (!dbUser) {
      console.log('Creating new user from Supabase auth:', supabaseUser.id)
      
      // Determine name from metadata or default
      const name = supabaseUser.user_metadata?.name || 'New User'
      
      dbUser = await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email || null,
          phone: supabaseUser.phone || null,
          phoneVerified: new Date(), // Assuming OTP login implies verification
          name: name,
          // SECURITY: Always default to CLIENT. Role elevation (to STEWARD or ADMIN) 
          // must happen via explicit admin action or approved application flow.
          // Never trust metadata for authorization.
          role: 'CLIENT',
        }
      })
    } else {
      // SYNC LOGIC: Keep Prisma in sync with Supabase Auth state
      const updates: any = {}
      let needsUpdate = false

      // 1. Sync Phone
      if (supabaseUser.phone && (!dbUser.phoneVerified || dbUser.phone !== supabaseUser.phone)) {
         updates.phoneVerified = new Date()
         updates.phone = supabaseUser.phone
         needsUpdate = true
      }

      // 2. Sync Email
      if (supabaseUser.email && dbUser.email !== supabaseUser.email) {
        updates.email = supabaseUser.email
        // If email is confirmed in Supabase, mark verified in Prisma (if you have an emailVerified field)
        // dbUser.emailVerified = supabaseUser.email_confirmed_at ? new Date(supabaseUser.email_confirmed_at) : null
        needsUpdate = true
      }

      if (needsUpdate) {
         await prisma.user.update({
            where: { id: dbUser.id },
            data: updates
         })
         // Refresh dbUser
         dbUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } })
      }
    }

    return NextResponse.json({
      success: true,
      data: dbUser,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
