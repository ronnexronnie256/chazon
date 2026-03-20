import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ServiceCard } from '@/components/ui/service-card';
import { ServiceFilterSidebar } from '@/components/ui/service-filter-sidebar';
import { Pagination } from '@/components/ui/pagination';
import { FilterChips } from '@/components/ui/filter-chips';
import { prisma } from '@/lib/prisma';
import { calculateStewardBadges } from '@/lib/badges';
import Link from 'next/link';
import { Package, AlertCircle } from 'lucide-react';
import type { Service, Category, StewardBadge } from '@/types/service';

interface ServiceResult {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  images: string[];
  category: Category;
  steward: {
    id: string;
    userId: string;
    name: string;
    image?: string;
    rating: number;
    totalReviews: number;
    bio?: string;
    badges: StewardBadge[];
  };
  isRecommended?: boolean;
}

interface CategoryResult {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

async function getServices(filters: {
  category?: string;
  price?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: ServiceResult[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 9;

  try {
    const where: any = {};

    if (filters.category && filters.category !== 'All') {
      where.category = filters.category;
    }

    if (filters.price) {
      where.price = { lte: parseFloat(filters.price) };
    }

    where.steward = { status: 'APPROVED' };

    let orderBy: any = { createdAt: 'desc' };
    if (filters.sortBy) {
      const [field, order] = filters.sortBy.split(':');
      if (field === 'price') {
        orderBy = { price: order === 'asc' ? 'asc' : 'desc' };
      }
    }

    const [totalCount, offerings] = await Promise.all([
      prisma.serviceOffering.count({ where }),
      prisma.serviceOffering.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          steward: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      }),
    ]);

    const stewardIds = offerings.map(o => o.steward.userId);
    const badgesResults = await Promise.all(
      stewardIds.map(userId => calculateStewardBadges(userId))
    );
    const badgesMap = new Map(
      stewardIds.map((id, i) => [id, badgesResults[i]])
    );

    const items: ServiceResult[] = offerings.map(offering => ({
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
        badges: badgesMap.get(offering.steward.userId) || [],
      },
    }));

    return { items, total: totalCount, page, pageSize };
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return { items: [], total: 0, page, pageSize };
  }
}

async function getCategories(): Promise<CategoryResult[]> {
  try {
    const categories = await prisma.serviceOffering.groupBy({
      by: ['category'],
      where: { steward: { status: 'APPROVED' } },
      _count: true,
      orderBy: { _count: { category: 'desc' } },
    });

    return categories.map(c => ({
      id: c.category.toLowerCase(),
      name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
      slug: c.category.toLowerCase(),
      count: c._count,
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

interface ServicesPageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ServicesPage({
  params,
  searchParams,
}: ServicesPageProps) {
  await params;
  const resolvedSearchParams = await searchParams;
  const filters = {
    category: resolvedSearchParams.category as string,
    price: resolvedSearchParams.price as string,
    sortBy: resolvedSearchParams.sortBy as string,
    page: resolvedSearchParams.page
      ? parseInt(resolvedSearchParams.page as string)
      : 1,
    pageSize: resolvedSearchParams.pageSize
      ? parseInt(resolvedSearchParams.pageSize as string)
      : 9,
  };

  const { items, total, page, pageSize } = await getServices(filters);
  const categories = await getCategories();
  const currentCategory = categories.find(c => c.slug === filters.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <ServiceFilterSidebar categories={categories} />
            </div>
            <div className="lg:col-span-3">
              <FilterChips />
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  {currentCategory
                    ? `${currentCategory.name} Services`
                    : 'All Services'}
                </h1>
                <p className="text-xl text-gray-600">
                  {currentCategory
                    ? `Explore ${currentCategory.count || ''} services in the ${currentCategory.name} category.`
                    : `Browse ${total} service professionals ready to help.`}
                </p>
              </div>

              {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {items.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No services found
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {filters.category
                      ? 'There are no services in this category yet. Check back soon or try another category.'
                      : 'No services match your search criteria. Try adjusting your filters.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link
                      href="/services"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Clear Filters
                    </Link>
                    <Link
                      href="/become-steward"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-chazon-primary hover:bg-chazon-primary-dark"
                    >
                      Become a Steward
                    </Link>
                  </div>
                </div>
              )}

              {total > pageSize && (
                <Pagination total={total} page={page} pageSize={pageSize} />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
