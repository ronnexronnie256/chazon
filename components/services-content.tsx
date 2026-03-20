'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ServiceCard } from '@/components/ui/service-card';
import { ServiceFilterSidebar } from '@/components/ui/service-filter-sidebar';
import { Pagination } from '@/components/ui/pagination';
import { FilterChips } from '@/components/ui/filter-chips';
import { useLocation } from '@/components/location-provider';
import { Package, MapPin, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Service } from '@/types/service';

interface ServiceWithMatch extends Service {
  matchScore?: number;
  distance?: number;
  isRecommended?: boolean;
  matchReasons?: string[];
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface ServicesContentProps {
  location: { lat: number; lng: number } | null;
}

export function ServicesContent({ location }: ServicesContentProps) {
  const searchParams = useSearchParams();
  const { status: locationStatus, onRequestLocation } = useLocation();

  const [services, setServices] = useState<ServiceWithMatch[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }
    fetchCategories();
  }, []);

  const filters = useMemo(
    () => ({
      category: searchParams.get('category') || '',
      price: searchParams.get('price') || '',
      sortBy: searchParams.get('sortBy') || '',
      page: searchParams.get('page')
        ? parseInt(searchParams.get('page') as string)
        : 1,
      pageSize: 9,
    }),
    [searchParams]
  );

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.category) params.set('category', filters.category);
        if (filters.price) params.set('maxPrice', filters.price);
        if (filters.sortBy) params.set('sortBy', filters.sortBy);
        if (filters.page > 1) params.set('page', filters.page.toString());
        params.set('limit', filters.pageSize.toString());

        // Add location params for smart matching
        if (location) {
          params.set('latitude', location.lat.toString());
          params.set('longitude', location.lng.toString());
        }

        const response = await fetch(`/api/services?${params.toString()}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setServices(data.data || []);
          setTotal(data.meta?.pagination?.total || 0);
        } else {
          setError(data.error || 'Failed to load services');
        }
      } catch (err) {
        setError('Failed to load services');
        console.error('Services fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [filters, location]);

  const recommendedCount = services.filter(s => s.isRecommended).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <ServiceFilterSidebar categories={categories} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <FilterChips />

              {/* Page Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      {filters.category
                        ? `${filters.category} Services`
                        : 'All Services'}
                    </h1>
                    <p className="text-gray-500">
                      {loading ? (
                        'Loading...'
                      ) : (
                        <>
                          {total} service{total !== 1 ? 's' : ''} available
                          {location && ' near you'}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Smart Match Toggle */}
                  <div className="flex items-center gap-2">
                    {locationStatus === 'loading' && (
                      <span className="flex items-center text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Getting location...
                      </span>
                    )}
                    {locationStatus === 'success' && location && (
                      <span className="flex items-center text-sm text-green-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        Smart matching on
                      </span>
                    )}
                    {locationStatus === 'error' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRequestLocation}
                        className="text-xs"
                      >
                        Enable Smart Match
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommended Banner */}
              {!loading && recommendedCount > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-chazon-primary/10 to-transparent rounded-xl border border-chazon-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-chazon-primary/20 rounded-lg">
                      <Sparkles className="h-5 w-5 text-chazon-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {recommendedCount} recommended service
                        {recommendedCount !== 1 ? 's' : ''} for you
                      </p>
                      <p className="text-sm text-gray-500">
                        Based on your location, availability, and preferences
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-pulse"
                    >
                      <div className="h-48 bg-gray-200" />
                      <div className="p-5 space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="flex gap-4 pt-2">
                          <div className="h-4 bg-gray-200 rounded w-16" />
                          <div className="h-4 bg-gray-200 rounded w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                /* Error State */
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                    <Package className="h-10 w-10 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Something went wrong
                  </h3>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : services.length > 0 ? (
                /* Services Grid */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {services.map(service => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        showDistance={!!location}
                        distance={service.distance}
                        isRecommended={service.isRecommended}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {total > filters.pageSize && (
                    <div className="mt-8">
                      <Pagination
                        total={total}
                        page={filters.page}
                        pageSize={filters.pageSize}
                      />
                    </div>
                  )}
                </>
              ) : (
                /* Empty State */
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-4">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No services found
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {filters.category
                      ? 'There are no services in this category yet.'
                      : 'No services match your search criteria.'}
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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
