'use client';

import Link from 'next/link';
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
  ArrowRight,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export type CategoryWithCount = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  icon: string | null;
  _count: {
    services: number;
  };
};

const iconMap: { [key: string]: LucideIcon } = {
  cleaning: Sparkles,
  handyman: Hammer,
  plumbing: Wrench,
  moving: Truck,
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
};

const categoryStyles = [
  {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    ring: 'ring-blue-100',
  },
  {
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-100',
  },
  {
    gradient: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    ring: 'ring-violet-100',
  },
  {
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    ring: 'ring-orange-100',
  },
  {
    gradient: 'from-pink-500 to-pink-600',
    bg: 'bg-pink-50',
    ring: 'ring-pink-100',
  },
  {
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-50',
    ring: 'ring-cyan-100',
  },
  {
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    ring: 'ring-amber-100',
  },
  {
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-50',
    ring: 'ring-indigo-100',
  },
  {
    gradient: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-50',
    ring: 'ring-rose-100',
  },
  {
    gradient: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-50',
    ring: 'ring-teal-100',
  },
  {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
    ring: 'ring-purple-100',
  },
  {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50',
    ring: 'ring-red-100',
  },
];

interface CategoriesProps {
  categories: CategoryWithCount[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export function Categories({ categories }: CategoriesProps) {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-bl from-chazon-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/3 h-64 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1.5 bg-chazon-primary/10 text-chazon-primary text-sm font-semibold rounded-full mb-4">
            Browse Services
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Popular <span className="gradient-text">Categories</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse thousands of services from trusted Stewards in your area
          </p>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {categories.map((category, index) => {
            const IconComponent = iconMap[category.slug] || iconMap.default;
            const style = categoryStyles[index % categoryStyles.length];
            return (
              <motion.div key={category.id} variants={itemVariants}>
                <Link
                  href={`/services?category=${category.slug}`}
                  className="block h-full"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-gray-100 hover:border-transparent group cursor-pointer overflow-hidden">
                    <CardContent className="p-5 md:p-6 text-center relative">
                      {/* Hover Background */}
                      <div
                        className={`absolute inset-0 ${style.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      />

                      {/* Icon */}
                      <div
                        className={`relative w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                      >
                        <IconComponent className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="relative font-semibold text-gray-900 mb-2 group-hover:text-chazon-primary transition-colors">
                        {category.name}
                      </h3>

                      {/* Task Count */}
                      <div className="relative flex items-center justify-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">
                          {category._count.services.toLocaleString()}+ services
                        </span>
                      </div>

                      {/* Hover Arrow */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <ArrowRight className="h-4 w-4 text-chazon-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All Button */}
        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-chazon-primary to-chazon-primary-dark text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-chazon-primary/25 transition-all duration-300 hover:-translate-y-0.5 group"
          >
            Explore All Services
            <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
