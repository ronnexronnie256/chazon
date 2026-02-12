'use client'

import Image from 'next/image'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { UserAvatar } from '@/components/ui/user-avatar'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, MapPin, CheckCircle, Clock, Sparkles } from 'lucide-react'
import { StewardBadges } from '@/components/ui/steward-badges'
import type { Service as ServiceCardType } from '@/types/service'

interface ServiceCardProps {
  service: ServiceCardType
  highlight?: string
}

function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query || !text.toLowerCase().includes(query.toLowerCase())) return <>{text}</>
  const q = query.toLowerCase()
  const parts = text.split(new RegExp(`(${query})`, 'ig'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q ? (
          <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function ServiceCard({ service, highlight }: ServiceCardProps) {
  const { steward } = service

  return (
    <Link href={`/service/${service.id}`} className="block group">
      <Card className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-2xl hover:border-chazon-primary/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
        <CardHeader className="p-0 relative">
          <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
            <ImageWithFallback
              src={service.images[0] || '/placeholder-image.jpg'}
              alt={service.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
            />
            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Top badges overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
              <Badge 
                variant="secondary" 
                className="capitalize text-xs font-semibold bg-white/95 backdrop-blur-sm text-gray-800 border-0 shadow-md"
              >
                {service.category.name}
              </Badge>
              {service.isRecommended && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 flex items-center gap-1 text-xs font-semibold shadow-lg border-0">
                  <Sparkles className="h-3 w-3 fill-current" />
                  Recommended
                </Badge>
              )}
            </div>

            {/* Price badge overlay */}
            <div className="absolute bottom-3 right-3 z-10">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
                <p className="text-lg font-bold text-chazon-primary whitespace-nowrap">
                  {service.currency || 'UGX'} {service.price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow p-5 space-y-3">
          <CardTitle className="text-xl font-bold text-gray-900 leading-tight line-clamp-2 min-h-[3rem] group-hover:text-chazon-primary transition-colors">
            <Highlight text={service.title} query={highlight} />
          </CardTitle>
          
          {service.description && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          )}

          <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-gray-100">
            {service.distance !== undefined && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1.5 text-chazon-primary flex-shrink-0" />
                <span className="font-medium">{service.distance.toFixed(1)} km</span>
              </div>
            )}
            {service.duration && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                <span>{service.duration} min</span>
              </div>
            )}
            {service.isAvailable !== undefined && (
              <div className="flex items-center text-sm">
                {service.isAvailable ? (
                  <span className="text-green-600 flex items-center font-medium">
                    <CheckCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    Available
                  </span>
                ) : (
                  <span className="text-gray-500">Unavailable</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-5 pt-0 border-t border-gray-100 bg-gradient-to-br from-gray-50/50 to-white">
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center min-w-0 flex-1 gap-3">
              <UserAvatar
                image={steward.image || null}
                name={steward.name || 'Steward'}
                size="md"
                className="flex-shrink-0 ring-2 ring-white shadow-md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-gray-900 truncate text-sm">{steward.name}</p>
                  {steward.badges && steward.badges.length > 0 && (
                    <StewardBadges badges={steward.badges} size="sm" />
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600 gap-1.5">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-0.5" />
                    <span className="font-semibold text-gray-900">
                      {steward.rating?.toFixed(1) || 'New'}
                    </span>
                  </div>
                  {steward.totalReviews !== undefined && steward.totalReviews > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        {steward.totalReviews} {steward.totalReviews === 1 ? 'review' : 'reviews'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
