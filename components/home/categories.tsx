'use client'

import Link from 'next/link'
import {
  Wrench,
  Truck,
  Sparkles,
  Hammer,
  Tv,
  Package,
  PaintBucket,
  Zap,
  Car,
  Home,
  Scissors,
  Camera,
  LucideIcon,
  HelpCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// This type definition should match the data structure from the API
export type CategoryWithCount = {
  id: string
  name: string
  description: string | null
  slug: string
  icon: string | null
  _count: {
    services: number
  }
}

// Map icon slugs to Lucide components
const iconMap: { [key: string]: LucideIcon } = {
  handyman: Hammer,
  moving: Truck,
  cleaning: Sparkles,
  'furniture-assembly': Wrench,
  'tv-mounting': Tv,
  delivery: Package,
  painting: PaintBucket,
  electrical: Zap,
  automotive: Car,
  'home-improvement': Home,
  'personal-care': Scissors,
  photography: Camera,
  default: HelpCircle,
}

// Pre-defined colors for category cards
const colors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-gray-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-cyan-500',
]

interface CategoriesProps {
  categories: CategoryWithCount[]
}

export function Categories({ categories }: CategoriesProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Browse Categories
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse thousands of services from trusted Stewards in your area
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {categories.map((category, index) => {
            const IconComponent = iconMap[category.slug] || iconMap.default
            const color = colors[index % colors.length]
            return (
              <Link
                key={category.id}
                href={`/services?category=${category.slug}`}
                className="group"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 shadow-md">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-chazon-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 h-10">
                      {category.description}
                    </p>
                    <div className="text-xs text-chazon-primary font-medium">
                      {`${category._count.services.toLocaleString()}+ tasks`}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/services"
            className="inline-flex items-center px-8 py-3 bg-chazon-primary text-white font-semibold rounded-xl hover:bg-chazon-primary-dark transition-colors duration-200"
          >
            View All Services
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}