'use client';

import Image from 'next/image';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { UserAvatar } from '@/components/ui/user-avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Star,
  MapPin,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { StewardBadges } from '@/components/ui/steward-badges';
import { motion } from 'framer-motion';
import type { Service as ServiceCardType } from '@/types/service';

interface ServiceCardProps {
  service: ServiceCardType & { distance?: number; isRecommended?: boolean };
  highlight?: string;
  showDistance?: boolean;
  distance?: number;
  isRecommended?: boolean;
}

function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query || !text.toLowerCase().includes(query.toLowerCase()))
    return <>{text}</>;
  const q = query.toLowerCase();
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q ? (
          <span key={i} className="bg-yellow-200 font-semibold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function ServiceCard({
  service,
  highlight,
  showDistance,
  distance,
  isRecommended,
}: ServiceCardProps) {
  const { steward } = service;
  const displayDistance = distance ?? service.distance;
  const displayRecommended = isRecommended ?? service.isRecommended;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={`/service/${service.id}`} className="block group">
        <Card className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-2xl hover:border-chazon-primary/30 transition-all duration-300">
          <CardHeader className="p-0 relative overflow-hidden">
            <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              <ImageWithFallback
                src={service.images[0] || '/placeholder-image.jpg'}
                alt={service.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Top badges */}
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
                <Badge
                  variant="secondary"
                  className="capitalize text-xs font-semibold bg-white/95 backdrop-blur-sm text-gray-800 border-0 shadow-lg"
                >
                  {service.category.name}
                </Badge>
                {displayRecommended && (
                  <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white hover:from-amber-500 hover:to-yellow-600 flex items-center gap-1 text-xs font-bold shadow-xl border-0 animate-pulse">
                    <Sparkles className="h-3 w-3 fill-current" />
                    Top Match
                  </Badge>
                )}
              </div>

              {/* Price Badge */}
              <div className="absolute bottom-3 right-3 z-10">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-xl">
                  <p className="text-lg font-bold text-chazon-primary whitespace-nowrap">
                    {service.currency || 'UGX'} {service.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    per service
                  </p>
                </div>
              </div>

              {/* Quick View on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl px-5 py-2.5 shadow-xl flex items-center gap-2 text-sm font-semibold text-gray-900">
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-grow p-5 space-y-3">
            <CardTitle className="text-lg font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-chazon-primary transition-colors">
              <Highlight text={service.title} query={highlight} />
            </CardTitle>

            {service.description && (
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {service.description}
              </p>
            )}

            <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-gray-100">
              {showDistance && displayDistance !== undefined && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1.5 text-chazon-primary flex-shrink-0" />
                  <span className="font-medium">
                    {displayDistance.toFixed(1)} km away
                  </span>
                </div>
              )}
              {service.duration && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                  <span>{service.duration} min</span>
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
                    <p className="font-semibold text-gray-900 truncate text-sm">
                      {steward.name}
                    </p>
                    {steward.badges && steward.badges.length > 0 && (
                      <StewardBadges badges={steward.badges} size="sm" />
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 gap-1.5">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400 mr-0.5" />
                      <span className="font-bold text-gray-900">
                        {steward.rating?.toFixed(1) || 'New'}
                      </span>
                    </div>
                    {steward.totalReviews !== undefined &&
                      steward.totalReviews > 0 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-500">
                            {steward.totalReviews} reviews
                          </span>
                        </>
                      )}
                  </div>
                </div>
              </div>

              {/* Verified indicator */}
              {steward.badges?.some(b => b.type === 'VERIFIED') && (
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
