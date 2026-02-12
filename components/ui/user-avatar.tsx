'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string | null
  image?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
}

export function UserAvatar({ name, image, size = 'md', className }: UserAvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {image && (
        <AvatarImage
          src={image}
          alt={name || 'User'}
          onError={(e) => {
            // Hide image on error, fallback will show
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-chazon-primary to-chazon-primary-dark text-white font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

