'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from './button';
import { useCallback } from 'react';

interface ServiceFilterSidebarProps {
  categories: {
    id: string;
    name: string;
    slug: string;
    count?: number;
  }[];
}

export function ServiceFilterSidebar({
  categories,
}: ServiceFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    router.replace(`${pathname}?${createQueryString('category', value)}`);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.replace(`${pathname}?${createQueryString('price', e.target.value)}`);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.replace(
      `${pathname}?${createQueryString('sortBy', e.target.value)}`
    );
  };

  const handleClearFilters = () => {
    router.replace(pathname);
  };

  const currentCategory = searchParams.get('category') || '';
  const currentPrice = searchParams.get('price') || '500000';
  const currentSort = searchParams.get('sortBy') || 'createdAt:desc';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold mb-4">Filters</h3>

      {/* Category Filter */}
      <div className="mb-6">
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Category
        </label>
        <select
          id="category"
          value={currentCategory}
          onChange={handleCategoryChange}
          className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-chazon-primary focus:border-chazon-primary"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.name}>
              {category.name} {category.count ? `(${category.count})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Max Price: {Number(currentPrice).toLocaleString()} UGX
        </label>
        <input
          type="range"
          id="price"
          min="10000"
          max="500000"
          step="10000"
          value={currentPrice}
          onChange={handlePriceChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-chazon-primary"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>10K</span>
          <span>500K</span>
        </div>
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <label
          htmlFor="sortBy"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Sort By
        </label>
        <select
          id="sortBy"
          value={currentSort}
          onChange={handleSortChange}
          className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-chazon-primary focus:border-chazon-primary"
        >
          <option value="createdAt:desc">Newest First</option>
          <option value="price:asc">Price: Low to High</option>
          <option value="price:desc">Price: High to Low</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      <Button onClick={handleClearFilters} variant="outline" className="w-full">
        Clear All Filters
      </Button>
    </div>
  );
}
