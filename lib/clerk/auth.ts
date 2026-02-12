import { auth, currentUser } from '@clerk/nextjs/server'
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
 
export class StepUpError extends Error {
  code = 'STEP_UP_REQUIRED'
  constructor(message = 'Step-up authentication required') {
    super(message)
    this.name = 'StepUpError'
  }
}
 
export async function getUser(): Promise<AuthUser | null> {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return null
  const user = await currentUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      image: true,
      role: true,
    },
  })
  const hasGoogle = (user as any).externalAccounts?.some(
    (a: any) => (a.provider || '').includes('google')
  )
  const provider = hasGoogle ? 'google' : 'email'
  const trustLevel = hasGoogle ? 'HIGH' : 'MEDIUM'
  if (!dbUser) {
    return {
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      image: user.imageUrl || undefined,
      role: 'CLIENT',
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
}
 
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
 
export async function requireRole(role: 'CLIENT' | 'STEWARD' | 'ADMIN'): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== role) {
    throw new Error('Forbidden')
  }
  return user
}
 
export async function requireTrustLevel(
  user: AuthUser,
  level: 'HIGH' | 'MEDIUM',
  action?: string
) {
  if (level === 'HIGH' && user.trustLevel !== 'HIGH') {
    throw new StepUpError(action ? `Re-auth required to ${action}` : 'Re-auth required')
  }
}
