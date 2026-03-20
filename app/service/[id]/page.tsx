import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { notFound } from 'next/navigation';
import { ServiceImageGallery } from '@/components/ui/service-image-gallery';
import { Badge } from '@/components/ui/badge';
import { BookingSteps } from '@/components/ui/booking-steps';
import { ServiceCard } from '@/components/ui/service-card';
import { StewardBadges } from '@/components/ui/steward-badges';
import { ReviewsList } from '@/components/ui/reviews-list';
import { UserAvatar } from '@/components/ui/user-avatar';
import { prisma } from '@/lib/prisma';
import { calculateStewardBadges } from '@/lib/badges';
import type { Service, StewardBadge } from '@/types/service';

export const dynamic = 'force-dynamic';

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ServiceDetailPage({
  params,
  searchParams,
}: ServiceDetailPageProps) {
  const { id } = await params;
  await searchParams;

  try {
    // Fetch service directly from database
    const offering = await prisma.serviceOffering.findUnique({
      where: { id },
      include: {
        steward: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (!offering) {
      notFound();
    }

    // Get steward badges
    const badges: StewardBadge[] = await calculateStewardBadges(
      offering.steward.userId
    );

    // Transform to Service type
    const service: Service = {
      id: offering.id,
      title: offering.title,
      description: offering.description || '',
      price: offering.price,
      currency: offering.currency,
      duration: offering.duration,
      images:
        offering.images.length > 0
          ? offering.images
          : [
              'https://images.unsplash.com/photo-1581578731117-104f8a338e2d?w=800&q=80',
            ],
      category: {
        id: offering.category.toLowerCase(),
        name:
          offering.category.charAt(0).toUpperCase() +
          offering.category.slice(1),
        slug: offering.category.toLowerCase(),
      },
      steward: {
        id: offering.steward.id,
        userId: offering.steward.userId,
        name: offering.steward.user.name,
        image: offering.steward.user.image || undefined,
        rating: offering.steward.rating,
        totalReviews: offering.steward.completedTasks,
        bio: offering.steward.bio || undefined,
        badges: badges,
      },
    };

    // Fetch related services
    const relatedOfferings = await prisma.serviceOffering.findMany({
      where: {
        category: offering.category,
        id: { not: id },
        steward: { status: 'APPROVED' },
      },
      take: 3,
      include: {
        steward: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    const relatedServices: Service[] = await Promise.all(
      relatedOfferings.map(async o => {
        const relatedBadges = await calculateStewardBadges(o.steward.userId);
        return {
          id: o.id,
          title: o.title,
          description: o.description || '',
          price: o.price,
          currency: o.currency,
          duration: o.duration,
          images:
            o.images.length > 0
              ? o.images
              : [
                  'https://images.unsplash.com/photo-1581578731117-104f8a338e2d?w=800&q=80',
                ],
          category: {
            id: o.category.toLowerCase(),
            name: o.category.charAt(0).toUpperCase() + o.category.slice(1),
            slug: o.category.toLowerCase(),
          },
          steward: {
            id: o.steward.id,
            userId: o.steward.userId,
            name: o.steward.user.name,
            image: o.steward.user.image || undefined,
            rating: o.steward.rating,
            totalReviews: o.steward.completedTasks,
            bio: o.steward.bio || undefined,
            badges: relatedBadges,
          },
        };
      })
    );

    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column: Image Gallery */}
              <div className="lg:col-span-2">
                <ServiceImageGallery
                  images={service.images}
                  title={service.title}
                />
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
                        {service.steward.badges &&
                          service.steward.badges.length > 0 && (
                            <StewardBadges
                              badges={service.steward.badges}
                              size="sm"
                            />
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
                  {service.steward.bio && (
                    <p className="text-gray-700">{service.steward.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Description */}
            {service.description && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  About this service
                </h2>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {service.description}
                  </p>
                </div>
              </div>
            )}

            {/* Related Services */}
            {relatedServices.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Related Services
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedServices.map(relatedService => (
                    <ServiceCard
                      key={relatedService.id}
                      service={relatedService}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error(`Failed to fetch service details for ID ${id}:`, error);
    notFound();
  }
}
