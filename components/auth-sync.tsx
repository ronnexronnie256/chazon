'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { User } from '@/types/user'

export function AuthSync() {
  const { login, logout, isAuthenticated, isLoggingOut } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      
      if (session?.user) {
        syncUser(session.user)
      } else {
        // Only call logout if authenticated and not already logging out
        if (isAuthenticated && !isLoggingOut) {
          logout()
        }
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        syncUser(session.user)
      } else if (event === 'SIGNED_OUT') {
        // Only call logout if we're still marked as authenticated and not already logging out
        // This prevents infinite loops when logout() already cleared the state
        if (isAuthenticated && !isLoggingOut) {
          logout()
        } else {
          // Just clear loading state if already logged out
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [login, logout, isAuthenticated, isLoggingOut])

  const syncUser = async (supabaseUser: any) => {
    try {
      // Fetch user data from API to get role and other custom fields
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const userData = await response.json()
        if (userData.success && userData.data) {
          const user: User = {
            id: userData.data.id,
            name: userData.data.name || '',
            email: userData.data.email || '',
            image: userData.data.image || undefined,
            role: userData.data.role || 'CLIENT',
            isSteward: userData.data.role === 'STEWARD',
          }
          login(user)
          return
        }
      }

      // Fallback to Supabase user data if API fails
      const role = supabaseUser.user_metadata?.role || 'CLIENT'
      const user: User = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
        email: supabaseUser.email || '',
        image: supabaseUser.user_metadata?.avatar_url || undefined,
        role: role as 'CLIENT' | 'STEWARD' | 'ADMIN',
        isSteward: role === 'STEWARD',
      }
      login(user)
    } catch (error) {
      console.error('Error syncing user:', error)
      if (isAuthenticated) {
        logout()
      }
    }
  }

  return null
}
