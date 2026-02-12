'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

type Props = Omit<ImageProps, 'src'> & {
  src: string
  fallbackSrc?: string
}

export function ImageWithFallback({ src, fallbackSrc = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop&q=60', alt, ...rest }: Props) {
  const [currentSrc, setCurrentSrc] = useState(src)

  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc)
      }}
    />
  )
}
