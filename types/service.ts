export type Category = {
  id: string
  name: string
  slug: string
  description?: string
}

export type StewardBadge = {
  type: 'VERIFIED' | 'TOP_RATED' | 'FAST_RESPONDER'
  label: string
  description: string
}

export type Steward = {
  id: string
  userId?: string // User ID for fetching reviews
  name: string
  image?: string
  rating?: number
  totalReviews?: number
  bio?: string
  badges?: StewardBadge[]
}

export type Service = {
  id: string
  title: string
  description: string
  price: number
  currency?: string
  duration: number
  images: string[]
  category: Category
  steward: Steward
  // Smart matching fields
  matchScore?: number
  distance?: number
  isAvailable?: boolean
  isRecommended?: boolean
  matchReasons?: string[]
}

