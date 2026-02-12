import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Hero } from '@/components/home/hero'
import { Categories } from '@/components/home/categories'
import { FeaturedServices } from '@/components/home/featured-services'
import { HowItWorks } from '@/components/home/how-it-works'
import { FeaturedStewards } from '@/components/home/featured-stewards'
import { Testimonials } from '@/components/home/testimonials'
import { Footer } from '@/components/layout/footer'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { CategoryWithCount } from '@/components/home/categories'
import { ApiClient } from '@/lib/api-client'
import { prisma } from '@/lib/prisma'

import { Service, Category } from '@/types/service'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let categoriesData: Category[] = []
  let servicesData: Service[] = []

  try {
    const [categoriesResponse, servicesResponse] = await Promise.all([
      ApiClient.categories.list(),
      ApiClient.services.list()
    ])
    categoriesData = categoriesResponse
    servicesData = servicesResponse.data
  } catch (error) {
    console.error('Failed to fetch home page data:', error)
  }

  // Get accurate service counts from database grouped by category
  const serviceCounts = await prisma.serviceOffering.groupBy({
    by: ['category'],
    _count: {
      id: true,
    },
  })

  // Helper function to normalize category name to slug format
  const normalizeToSlug = (categoryName: string): string => {
    return categoryName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
  }

  // Create a map of normalized category slug to count
  const countMap = new Map<string, number>()
  serviceCounts.forEach((item) => {
    const normalizedSlug = normalizeToSlug(item.category)
    // Store count for the normalized slug
    const existingCount = countMap.get(normalizedSlug) || 0
    countMap.set(normalizedSlug, existingCount + item._count.id)
  })

  const categories: CategoryWithCount[] = categoriesData.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    slug: c.slug,
    icon: null,
    _count: { services: countMap.get(c.slug) || 0 },
  }))

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Categories categories={categories} />
        <FeaturedServices services={servicesData} categories={categoriesData} />
        <HowItWorks />
        <Suspense fallback={<LoadingSpinner />}>
          <FeaturedStewards />
        </Suspense>
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}
