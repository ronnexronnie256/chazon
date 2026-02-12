'use client'

import { useState, useEffect } from 'react'
import { Star, MapPin, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface FeaturedSteward {
  id: string
  userId: string
  name: string
  image: string
  rating: number
  reviewCount: number
  hourlyRate: number
  location: string
  skills: string[]
  completedTasks: number
  responseTime: string
  isVerified: boolean
  bio: string
  badges?: Array<{
    type: string
    label: string
    description: string
  }>
}

export function FeaturedStewards() {
  const [stewards, setStewards] = useState<FeaturedSteward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStewards() {
      try {
        setLoading(true)
        const response = await fetch('/api/stewards?limit=4')
        const data = await response.json()
        
        if (data.success) {
          setStewards(data.data)
        } else {
          setError(data.error || 'Failed to fetch stewards')
        }
      } catch (err) {
        console.error('Error fetching stewards:', err)
        setError('Failed to load stewards')
      } finally {
        setLoading(false)
      }
    }

    fetchStewards()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Stewards
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet some of our top-rated Stewards who are ready to help with your next project.
            </p>
          </div>
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    )
  }

  if (error || stewards.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Stewards
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet some of our top-rated Stewards who are ready to help with your next project.
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">
              {error || 'No featured stewards available at the moment.'}
            </p>
          </div>
        </div>
      </section>
    )
  }
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Stewards
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet some of our top-rated Stewards who are ready to help with your next project.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stewards.map((steward) => (
            <Card key={steward.id} className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center mb-4">
                  <Avatar className="w-16 h-16 mr-4">
                    <AvatarImage src={steward.image} alt={steward.name} />
                    <AvatarFallback>{steward.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{steward.name}</h3>
                      {steward.isVerified && (
                        <CheckCircle className="w-4 h-4 text-chazon-primary" />
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-medium">{steward.rating}</span>
                      <span className="ml-1">({steward.reviewCount})</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{steward.location}</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {steward.bio}
                </p>

                {/* Skills */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {steward.skills.slice(0, 2).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {steward.skills.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{steward.skills.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-gray-500">Completed Tasks</div>
                    <div className="font-semibold text-gray-900">{steward.completedTasks}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Response Time</div>
                    <div className="font-semibold text-gray-900 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {steward.responseTime}
                    </div>
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">UGX {steward.hourlyRate.toLocaleString()}</span>
                      <span className="text-gray-500">/hr</span>
                    </div>
                  </div>
                  <Link href={`/services?stewardId=${steward.userId}`} className="block">
                    <Button className="w-full bg-chazon-primary hover:bg-chazon-primary-dark">
                      View Services
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/stewards">
            <Button variant="outline" size="lg" className="px-8">
              Browse All Stewards
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}