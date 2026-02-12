'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type PaginationProps = {
  total: number
  page: number
  pageSize: number
}

export function Pagination({ total, page, pageSize }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  const navigate = (nextPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(nextPage))
    params.set('pageSize', String(pageSize))
    router.replace(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="mt-8 flex items-center justify-between">
      <button
        className="px-3 py-2 rounded-md border border-gray-300 text-sm disabled:opacity-50"
        onClick={() => navigate(page - 1)}
        disabled={!canPrev}
      >
        Previous
      </button>
      <div className="text-sm text-gray-700">
        Page {page} of {totalPages}
      </div>
      <button
        className="px-3 py-2 rounded-md border border-gray-300 text-sm disabled:opacity-50"
        onClick={() => navigate(page + 1)}
        disabled={!canNext}
      >
        Next
      </button>
    </div>
  )
}

