import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { notFound } from 'next/navigation'
import { ServiceImageGallery } from '@/components/ui/service-image-gallery'
import { Badge } from '@/components/ui/badge'
import { BookingSteps } from '@/components/ui/booking-steps'
import { ApiClient } from '@/lib/api-client'
import { ServiceCard } from '@/components/ui/service-card'
import { StewardBadges } from '@/components/ui/steward-badges'
import { ReviewsList } from '@/components/ui/reviews-list'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Service } from '@/types/service'

export const dynamic = 'force-dynamic'

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ServiceDetailPage({ params, searchParams }: ServiceDetailPageProps) {
  const { id } = await params
  // We don't use searchParams in this page, but it's required by Next.js 15
  await searchParams

  let service: Service | null = null
  let relatedServices: Service[] = []

  try {
    service = await ApiClient.services.get(id)

    if (service) {
      // Fetch related services
      const relatedResponse = await ApiClient.services.list(new URLSearchParams({ category: service.category.slug }))
      relatedServices = relatedResponse.data.filter(s => s.id !== service!.id).slice(0, 3)
    }
  } catch (error) {
    console.error(`Failed to fetch service details for ID ${id}:`, error)
    notFound()
  }

  if (!service) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Image Gallery */}
            <div className="lg:col-span-2">
              <ServiceImageGallery images={service.images} title={service.title} />
            </div>

            {/* Right Column: Service Info & Booking */}
            <div className="lg:col-span-1">
              <Badge variant="secondary" className="mb-2">
                {service.category.name}
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {service.title}
              </h1>
              <p className="text-2xl font-bold text-green-600 mb-6">
                UGX {service.price.toLocaleString()}
              </p>
              <BookingSteps serviceId={service.id} />

              {/* Steward Info */}
              <div className="bg-gray-50 p-6 rounded-2xl mt-6">
                <div className="flex items-center mb-4">
                  <UserAvatar
                    name={service.steward.name}
                    image={service.steward.image}
                    size="xl"
                    className="mr-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {service.steward.name}
                      </h3>
                      {service.steward.badges && service.steward.badges.length > 0 && (
                        <StewardBadges badges={service.steward.badges} size="sm" />
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="font-semibold">
                        {service.steward.rating?.toFixed(1) || 'New'}
                      </span>
                      <span className="ml-1">
                        ({service.steward.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">{service.steward.bio}</p>
              </div>
            </div>
          </div>

          {/* Bottom Section: Description & Reviews */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              About this service
            </h2>
            <p className="text-lg text-gray-700 whitespace-pre-wrap">
              {service.description}
            </p>
            <div className="mt-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">What's included</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                <li className="flex items-center"><span className="text-green-600 mr-2">✔</span>Arrival within scheduled window</li>
                <li className="flex items-center"><span className="text-green-600 mr-2">✔</span>All necessary tools</li>
                <li className="flex items-center"><span className="text-green-600 mr-2">✔</span>Professional cleanup</li>
                <li className="flex items-center"><span className="text-green-600 mr-2">✔</span>Quality check and walkthrough</li>
              </ul>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What people are saying</h2>
            {service.steward.userId ? (
              <ReviewsList userId={service.steward.userId} showStats={true} />
            ) : (
              <p className="text-lg text-gray-500">No reviews yet.</p>
            )}
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Related services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedServices.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
