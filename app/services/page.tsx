import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ServiceCard } from '@/components/ui/service-card';
import { ServiceFilterSidebar } from '@/components/ui/service-filter-sidebar';
import { Pagination } from '@/components/ui/pagination';
import { FilterChips } from '@/components/ui/filter-chips';
import { ApiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Package } from 'lucide-react';

// This function fetches the services and its return type will be used to infer the service type
async function getServices(filters: {
  category?: string;
  price?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.price) params.set('maxPrice', filters.price);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.pageSize) params.set('limit', filters.pageSize.toString());

  try {
    const response = await ApiClient.services.list(params);
    return {
      items: response.data,
      total: response.meta?.pagination?.total || 0,
      page: response.meta?.pagination?.page || 1,
      pageSize: filters.pageSize || 9,
    };
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return { items: [], total: 0, page: 1, pageSize: 9 };
  }
}

interface ServicesPageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getCategories() {
  try {
    return await ApiClient.categories.list();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export default async function ServicesPage({
  params,
  searchParams,
}: ServicesPageProps) {
  // We don't use params in this page, but it's required by Next.js 15
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
                    ? `Explore services in the ${currentCategory.name} category.`
                    : 'Find the perfect steward for any task.'}
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

              <Pagination total={total} page={page} pageSize={pageSize} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
