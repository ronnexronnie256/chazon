'use client';

import { MapPin, Loader2 } from 'lucide-react';

export function ServicesLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading services...</span>
          </div>
        </div>
      </div>
      <main className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-20" />
                    </div>
                  ))}
                </div>
                <div className="h-px bg-gray-200 my-6" />
                <div className="h-6 bg-gray-200 rounded w-20 mb-4" />
                <div className="space-y-2">
                  <div className="h-10 bg-gray-200 rounded" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filter Chips */}
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-8 bg-gray-200 rounded-full w-20 animate-pulse"
                  />
                ))}
              </div>

              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-300" />
                  <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
                </div>
              </div>

              {/* Services Grid */}
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
                      <div className="pt-2 flex items-center justify-between">
                        <div className="h-6 bg-gray-200 rounded w-20" />
                        <div className="h-8 bg-gray-200 rounded w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
