'use client';

import { useState } from 'react';
import { ServiceCard } from '@/components/ui/service-card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, LayoutGrid, LayoutList } from 'lucide-react';
import { Service, Category } from '@/types/service';

interface FeaturedServicesProps {
  services: Service[];
  categories: Category[];
}

export function FeaturedServices({
  services,
  categories,
}: FeaturedServicesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGridView, setIsGridView] = useState(true);

  const filteredServices =
    selectedCategory === 'all'
      ? services
      : services.filter(s => s.category.slug === selectedCategory);

  const displayedCategories = [
    { slug: 'all', name: 'All Services' },
    ...categories.filter(c => services.some(s => s.category.slug === c.slug)),
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-0 w-96 h-96 bg-chazon-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1.5 bg-chazon-primary/10 text-chazon-primary text-sm font-semibold rounded-full mb-4">
            <Sparkles className="w-4 h-4 inline mr-1.5" />
            Featured Services
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Top-Rated <span className="gradient-text">Services</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover exceptional services from our highest-rated and most
            reviewed Stewards.
          </p>
        </motion.div>

        {/* Filter Tabs & View Toggle */}
        <motion.div
          className="flex flex-wrap items-center justify-between gap-4 mb-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {displayedCategories.map(category => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === category.slug
                    ? 'bg-gradient-to-r from-chazon-primary to-chazon-primary-dark text-white shadow-lg shadow-chazon-primary/25 transform scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-2 rounded-md transition-all ${
                isGridView
                  ? 'bg-chazon-primary text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-2 rounded-md transition-all ${
                !isGridView
                  ? 'bg-chazon-primary text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          layout
          className={
            isGridView
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.slice(0, 6).map((service, index) => (
              <motion.div
                layout
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ServiceCard
                  service={service}
                  isRecommended={service.isRecommended}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-500 text-lg">
              No services found in this category.
            </p>
          </motion.div>
        )}

        {/* View All Button */}
        {filteredServices.length > 0 && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/services">
              <Button
                variant="outline"
                size="lg"
                className="border-2 font-semibold px-8 group hover:bg-chazon-primary hover:text-white hover:border-chazon-primary transition-all"
              >
                View All Services
                <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
