'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from './button'

interface ServiceFilterSidebarProps {
  categories: {
    id: string
    name: string
    slug: string
  }[]
}

export function ServiceFilterSidebar({ categories }: ServiceFilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams)
    params.set(e.target.name, e.target.value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleClearFilters = () => {
    router.replace(pathname)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Filters</h3>

      {/* Category Filter */}
      <div className="mb-6">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          id="category"
          name="category"
          onChange={handleFilterChange}
          defaultValue={searchParams.get('category') || ''}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-chazon-primary focus:border-chazon-primary"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
          Max Price
        </label>
        <input
          type="range"
          id="price"
          name="price"
          min="0"
          max="500"
          defaultValue={searchParams.get('price') || '500'}
          onChange={handleFilterChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>0 UGX</span>
          <span>{Number(searchParams.get('price') || '1850000').toLocaleString()} UGX</span>
        </div>
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <select
          id="sortBy"
          name="sortBy"
          onChange={handleFilterChange}
          defaultValue={searchParams.get('sortBy') || 'createdAt:desc'}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-chazon-primary focus:border-chazon-primary"
        >
          <option value="createdAt:desc">Newest</option>
          <option value="price:asc">Price: Low to High</option>
          <option value="price:desc">Price: High to Low</option>
          <option value="rating:desc">Rating: High to Low</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      <Button
        onClick={handleClearFilters}
        variant="outline"
        className="w-full"
      >
        Clear Filters
      </Button>
    </div>
  )
}