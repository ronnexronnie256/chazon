'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, Star, Zap } from 'lucide-react'

export type BadgeType = 'VERIFIED' | 'TOP_RATED' | 'FAST_RESPONDER'

interface StewardBadge {
  type: BadgeType
  label: string
  description: string
}

interface StewardBadgesProps {
  badges: StewardBadge[]
  size?: 'sm' | 'md' | 'lg'
  showDescription?: boolean
}

export function StewardBadges({ badges, size = 'md', showDescription = false }: StewardBadgesProps) {
  if (badges.length === 0) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const getBadgeIcon = (type: BadgeType) => {
    switch (type) {
      case 'VERIFIED':
        return <CheckCircle className={iconSizes[size]} />
      case 'TOP_RATED':
        return <Star className={iconSizes[size]} />
      case 'FAST_RESPONDER':
        return <Zap className={iconSizes[size]} />
    }
  }

  const getBadgeColor = (type: BadgeType) => {
    switch (type) {
      case 'VERIFIED':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300'
      case 'TOP_RATED':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-300'
      case 'FAST_RESPONDER':
        return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300'
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((badge) => (
        <Badge
          key={badge.type}
          variant="outline"
          className={`${getBadgeColor(badge.type)} ${sizeClasses[size]} flex items-center gap-1 font-medium`}
          title={showDescription ? undefined : badge.description}
        >
          {getBadgeIcon(badge.type)}
          <span>{badge.label}</span>
        </Badge>
      ))}
    </div>
  )
}

