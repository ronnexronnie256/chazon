/**
 * Supabase client for middleware
 * Use this in middleware.ts
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isOnSettings = request.nextUrl.pathname.startsWith('/settings')
  const isOnBookings = request.nextUrl.pathname.startsWith('/bookings')
  const isOnAuth = request.nextUrl.pathname.startsWith('/auth')
  const isOnResetPassword = request.nextUrl.pathname === '/auth/reset-password'

  // Redirect unauthenticated users from protected routes
  if ((isOnDashboard || isOnSettings || isOnBookings) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  // BUT allow reset-password page (users need recovery session to reset password)
  if (isOnAuth && user && !isOnResetPassword) {
    const url = request.nextUrl.clone()
    url.pathname = '/services'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

