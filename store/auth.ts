import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user';

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoggingOut: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isLoggingOut: false,
      login: user => {
        set({ isAuthenticated: true, user, isLoggingOut: false });
      },
      logout: async () => {
        if (get().isLoggingOut) {
          return;
        }

        set({ isLoggingOut: true, isAuthenticated: false, user: null });

        try {
          await fetch('/api/auth/signout', {
            method: 'POST',
            credentials: 'include',
          });

          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Error signing out:', error);
        } finally {
          set({ isLoggingOut: false });
        }
      },
      updateUser: updates =>
        set(state => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        })),
      refreshUser: async () => {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              set({ user: data.user });
            }
          }
        } catch (error) {
          console.error('Error refreshing user:', error);
        }
      },
    }),
    { name: 'auth-store' }
  )
);
