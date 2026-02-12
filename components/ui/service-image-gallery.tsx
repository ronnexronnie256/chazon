'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'

interface ServiceImageGalleryProps {
  images: string[]
  title: string
}

export function ServiceImageGallery({ images, title }: ServiceImageGalleryProps) {
  const [mainImage, setMainImage] = useState(images[0] || '/placeholder.svg')

  if (!images || images.length === 0) {
    images = ['/placeholder.svg']
  }

  return (
    <div>
      <Card className="relative h-96 w-full rounded-2xl overflow-hidden shadow-lg mb-4">
        <Image
          src={mainImage}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="transition-opacity duration-300"
        />
      </Card>
      <div className="grid grid-cols-5 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative h-24 w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${mainImage === image ? 'ring-4 ring-chazon-primary' : 'hover:opacity-80'}`}
            onClick={() => setMainImage(image)}
          >
            <Image
              src={image}
              alt={`${title} thumbnail ${index + 1}`}
              layout="fill"
              objectFit="cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
