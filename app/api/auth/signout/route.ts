import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to sign out' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    })
  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

