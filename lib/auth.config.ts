import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnSettings = nextUrl.pathname.startsWith('/settings')
      const isOnBookings = nextUrl.pathname.startsWith('/bookings')
      const isOnAuth = nextUrl.pathname.startsWith('/auth')

      if (isOnDashboard || isOnSettings || isOnBookings) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isOnAuth) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/services', nextUrl))
        }
        return true
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // @ts-ignore
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        // @ts-ignore
        session.user.role = token.role as string
      }
      return session
    },
  },
  providers: [], // Configured in lib/auth.ts
} satisfies NextAuthConfig
