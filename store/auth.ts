import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'

type AuthState = {
  isAuthenticated: boolean
  user: User | null
  isLoggingOut: boolean // Flag to prevent logout loops
  login: (user: User) => void
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isLoggingOut: false,
      login: (user) => {
        set({ isAuthenticated: true, user, isLoggingOut: false })
      },
      logout: async () => {
        // Prevent multiple simultaneous logout calls
        if (get().isLoggingOut) {
          return
        }

        set({ isLoggingOut: true, isAuthenticated: false, user: null })
        
        try {
          // Sign out from Supabase Auth via API (handles server-side session)
          await fetch('/api/auth/signout', {
            method: 'POST',
            credentials: 'include',
          })
          
          // Sign out from client-side Supabase (triggers onAuthStateChange)
          // The listener will check isLoggingOut to prevent calling logout again
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          await supabase.auth.signOut()
        } catch (error) {
          console.error('Error signing out:', error)
        } finally {
          set({ isLoggingOut: false })
        }
      },
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : state.user })),
    }),
    { name: 'auth-store' }
  )
)
