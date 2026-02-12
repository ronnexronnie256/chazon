'use client'

import { useState } from 'react'
import { ServiceCard } from '@/components/ui/service-card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Service, Category } from '@/types/service'

interface FeaturedServicesProps {
  services: Service[]
  categories: Category[]
}

export function FeaturedServices({ services, categories }: FeaturedServicesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category.slug === selectedCategory)

  // Only show categories that have services
  const displayedCategories = [
    { slug: 'all', name: 'All Services' },
    ...categories.filter(c => services.some(s => s.category.slug === c.slug))
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Services
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover top-rated services from experienced Stewards in your community.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {displayedCategories.map((category) => (
            <button
              key={category.slug}
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.slug
                  ? 'bg-chazon-primary text-white shadow-md transform scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service) => (
              <motion.div
                layout
                key={service.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredServices.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No services found in this category.</p>
          </div>
        )}

        <div className="text-center mt-12">
           <Link href="/services">
             <Button variant="outline" size="lg" className="border-2 font-semibold">
                View All Services
             </Button>
           </Link>
        </div>
      </div>
    </section>
  )
}
