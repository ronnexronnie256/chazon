import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ServiceCard } from '@/components/ui/service-card'
import { ServiceFilterSidebar } from '@/components/ui/service-filter-sidebar'
import { Pagination } from '@/components/ui/pagination'
import { FilterChips } from '@/components/ui/filter-chips'
import { ApiClient } from '@/lib/api-client'

// This function fetches the services and its return type will be used to infer the service type
async function getServices(filters: { category?: string; price?: string; sortBy?: string; page?: number; pageSize?: number }) {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.price) params.set('maxPrice', filters.price)
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.page) params.set('page', filters.page.toString())
  if (filters.pageSize) params.set('limit', filters.pageSize.toString())

  try {
    const response = await ApiClient.services.list(params)
    return {
      items: response.data,
      total: response.meta?.pagination?.total || 0,
      page: response.meta?.pagination?.page || 1,
      pageSize: filters.pageSize || 9
    }
  } catch (error) {
    console.error('Failed to fetch services:', error)
    return { items: [], total: 0, page: 1, pageSize: 9 }
  }
}

interface ServicesPageProps {
  params: Promise<Record<string, string>>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function getCategories() {
  try {
    return await ApiClient.categories.list()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

export default async function ServicesPage({ params, searchParams }: ServicesPageProps) {
  // We don't use params in this page, but it's required by Next.js 15
  await params
  const resolvedSearchParams = await searchParams
  const filters = {
    category: resolvedSearchParams.category as string,
    price: resolvedSearchParams.price as string,
    sortBy: resolvedSearchParams.sortBy as string,
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page as string) : 1,
    pageSize: resolvedSearchParams.pageSize ? parseInt(resolvedSearchParams.pageSize as string) : 9,
  }

  const { items, total, page, pageSize } = await getServices(filters)
  const categories = await getCategories()
  const currentCategory = categories.find(c => c.slug === filters.category)

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
                  {currentCategory ? `${currentCategory.name} Services` : 'All Services'}
                </h1>
                <p className="text-xl text-gray-600">
                  {currentCategory
                    ? `Explore services in the ${currentCategory.name} category.`
                    : 'Find the perfect steward for any task.'}
                </p>
              </div>

              {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {items.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-gray-500">
                    No services found with the current filters.
                  </p>
                </div>
              )}

              <Pagination total={total} page={page} pageSize={pageSize} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
