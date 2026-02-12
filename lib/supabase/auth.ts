/**
 * Auth helper functions for Supabase
 */
import { createClient } from './server'
import { prisma } from '@/lib/prisma'

export interface AuthUser {
  id: string
  email?: string
  phone?: string
  name?: string
  image?: string
  role?: string
  authProvider?: string
  trustLevel?: 'HIGH' | 'MEDIUM'
}

/**
 * Get the current authenticated user
 */
export async function getUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser()

    if (error || !supabaseUser) {
      return null
    }

    // Determine trust level based on auth provider
    // Check app_metadata.last_sign_in_provider (preferred) or provider
    // Google OAuth = HIGH trust, Password/Email = MEDIUM trust
    const appMetadata = supabaseUser.app_metadata || {}
    const provider = appMetadata.last_sign_in_provider || appMetadata.provider || 'email'
    const trustLevel = provider === 'google' ? 'HIGH' : 'MEDIUM'

    // Get user from Prisma to get role and other custom fields
    const dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        image: true,
        role: true,
      },
    })

    if (!dbUser) {
      // If user exists in Supabase but not Prisma, return basic info
      // This allows the API to create the user record
      return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        phone: supabaseUser.phone,
        role: 'CLIENT', // Default role
        authProvider: provider,
        trustLevel,
      }
    }

    return {
      id: dbUser.id,
      email: dbUser.email || undefined,
      phone: dbUser.phone || undefined,
      name: dbUser.name,
      image: dbUser.image || undefined,
      role: dbUser.role,
      authProvider: provider,
      trustLevel,
    }
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Require specific role
 */
export async function requireRole(role: 'CLIENT' | 'STEWARD' | 'ADMIN'): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== role) {
    throw new Error('Forbidden')
  }
  return user
}

