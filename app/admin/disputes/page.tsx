"use client"

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { 
  AlertTriangle, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  DollarSign,
  Download
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface Dispute {
  id: string
  taskId: string
  openerId: string
  reason: string
  status: string
  resolution: string | null
  createdAt: string
  updatedAt: string
  task: {
    id: string
    category: string
    agreedPrice: number
    currency: string
    status: string
    client: {
      id: string
      name: string
      email: string
      image: string | null
    }
    steward: {
      id: string
      name: string
      email: string
      image: string | null
    }
  }
  opener: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export default function AdminDisputesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('OPEN')
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState('')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    if (user?.role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/dashboard')
      return
    }

    fetchDisputes()
  }, [isAuthenticated, statusFilter, page, router, user])

  const fetchDisputes = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      params.append('page', page.toString())
      
      const response = await fetch(`/api/admin/disputes?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch disputes')
      }

      setDisputes(data.data || [])
      setTotalPages(data.meta?.pagination?.totalPages || 1)
    } catch (error: any) {
      console.error('Error fetching disputes:', error)
      toast.error(error.message || 'Failed to load disputes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleResolve = async (disputeId: string, newStatus: string) => {
    if (newStatus === 'RESOLVED' && !resolution.trim()) {
      toast.error('Please provide a resolution before resolving the dispute')
      return
    }

    setIsProcessing(disputeId)
    try {
      const response = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId,
          status: newStatus,
          resolution: newStatus === 'RESOLVED' ? resolution : null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update dispute')
      }

      toast.success(`Dispute ${newStatus.toLowerCase()} successfully`)
      setSelectedDispute(null)
      setResolution('')
      fetchDisputes()
    } catch (error: any) {
      console.error('Error updating dispute:', error)
      toast.error(error.message || 'Failed to update dispute')
    } finally {
      setIsProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Open
          </span>
        )
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </span>
        )
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Dispute Resolution</h1>
              <p className="text-gray-600">Review and resolve task disputes</p>
            </div>
            <button
              onClick={() => {
                const url = `/api/admin/export?type=disputes`
                const a = document.createElement('a')
                a.href = url
                a.download = `disputes_export_${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                toast.success('Export started')
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex gap-2">
              {(['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-chazon-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600">No disputes found</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Dispute for: {dispute.task.category}
                          </h3>
                          {getStatusBadge(dispute.status)}
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-900 mb-1">Reason</p>
                              <p className="text-sm text-red-800">{dispute.reason}</p>
                            </div>
                          </div>
                        </div>
                        {dispute.resolution && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-green-900 mb-1">Resolution</p>
                                <p className="text-sm text-green-800">{dispute.resolution}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Link href={`/booking/confirmation/${dispute.taskId}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Task
                          </Button>
                        </Link>
                        {dispute.status !== 'RESOLVED' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedDispute(dispute)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Opened By</h4>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                            {dispute.opener.image ? (
                              <ImageWithFallback
                                src={dispute.opener.image}
                                alt={dispute.opener.name}
                                width={32}
                                height={32}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                {dispute.opener.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{dispute.opener.name}</p>
                            <p className="text-xs text-gray-500">{dispute.opener.email}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Client</h4>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                            {dispute.task.client.image ? (
                              <ImageWithFallback
                                src={dispute.task.client.image}
                                alt={dispute.task.client.name}
                                width={32}
                                height={32}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                {dispute.task.client.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{dispute.task.client.name}</p>
                            <p className="text-xs text-gray-500">{dispute.task.client.email}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Steward</h4>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                            {dispute.task.steward.image ? (
                              <ImageWithFallback
                                src={dispute.task.steward.image}
                                alt={dispute.task.steward.name}
                                width={32}
                                height={32}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                {dispute.task.steward.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{dispute.task.steward.name}</p>
                            <p className="text-xs text-gray-500">{dispute.task.steward.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-500">Task Value</p>
                        <p className="font-medium">
                          {dispute.task.currency} {dispute.task.agreedPrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Opened</p>
                        <p className="font-medium">{new Date(dispute.createdAt).toLocaleString()}</p>
                      </div>
                      {dispute.updatedAt !== dispute.createdAt && (
                        <div>
                          <p className="text-gray-500">Last Updated</p>
                          <p className="font-medium">{new Date(dispute.updatedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Resolve Dispute</h2>
                <button
                  onClick={() => {
                    setSelectedDispute(null)
                    setResolution('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Dispute Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Reason</p>
                  <p className="font-medium">{selectedDispute.reason}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Enter your resolution for this dispute..."
                  rows={6}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This resolution will be visible to both the client and steward.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDispute(null)
                    setResolution('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleResolve(selectedDispute.id, 'UNDER_REVIEW')}
                  disabled={isProcessing === selectedDispute.id}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Mark Under Review
                </Button>
                <Button
                  onClick={() => handleResolve(selectedDispute.id, 'RESOLVED')}
                  disabled={isProcessing === selectedDispute.id || !resolution.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve Dispute
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

