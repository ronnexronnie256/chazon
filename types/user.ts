export type User = {
  id: string
  name: string
  email: string
  image?: string
  phone?: string
  address?: string
  city?: string
  location?: string
  bio?: string
  role?: 'CLIENT' | 'STEWARD' | 'ADMIN'
  isSteward?: boolean
  isVerified?: boolean
  rating?: number
  totalReviews?: number
  createdAt?: string
}

