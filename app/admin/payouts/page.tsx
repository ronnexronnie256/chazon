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
  DollarSign, 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Lock,
  Unlock,
  Download
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Payout {
  id: string
  taskId: string
  amount: number
  status: string
  paymentMethod: string | null
  providerTransactionId: string | null
  metadata: any
  createdAt: string
  task: {
    id: string
    category: string
    steward: {
      id: string
      name: string
      email: string
      image: string | null
    }
    client: {
      id: string
      name: string
    }
  }
}

export default function AdminPayoutsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [action, setAction] = useState<string>('')
  const [notes, setNotes] = useState('')
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

    fetchPayouts()
  }, [isAuthenticated, statusFilter, page, router, user])

  const fetchPayouts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      params.append('page', page.toString())
      
      const response = await fetch(`/api/admin/payouts?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payouts')
      }

      setPayouts(data.data || [])
      setTotalPages(data.meta?.pagination?.totalPages || 1)
    } catch (error: any) {
      console.error('Error fetching payouts:', error)
      toast.error(error.message || 'Failed to load payouts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleAction = async (payoutId: string, actionType: string) => {
    if ((actionType === 'approve' || actionType === 'reject' || actionType === 'freeze') && !notes.trim()) {
      toast.error('Please provide notes for this action')
      return
    }

    setIsProcessing(payoutId)
    try {
      const response = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          action: actionType,
          notes: notes.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payout')
      }

      toast.success(`Payout ${actionType}d successfully`)
      setSelectedPayout(null)
      setAction('')
      setNotes('')
      fetchPayouts()
    } catch (error: any) {
      console.error('Error updating payout:', error)
      toast.error(error.message || 'Failed to update payout')
    } finally {
      setIsProcessing(null)
    }
  }

  const getStatusBadge = (status: string, metadata: any) => {
    const isFrozen = metadata?.frozen === true
    
    if (isFrozen) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Lock className="h-3 w-3 mr-1" />
          Frozen
        </span>
      )
    }

    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
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

  const getTotalAmount = () => {
    return payouts.reduce((sum, p) => sum + p.amount, 0)
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Payout Management</h1>
              <p className="text-gray-600">Control and monitor steward payouts</p>
            </div>
            <button
              onClick={() => {
                const url = `/api/admin/export?type=payouts`
                const a = document.createElement('a')
                a.href = url
                a.download = `payouts_export_${new Date().toISOString().split('T')[0]}.csv`
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

          {/* Summary */}
          {payouts.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount (Current View)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${getTotalAmount().toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payouts Count</p>
                  <p className="text-2xl font-bold text-gray-900">{payouts.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex gap-2">
              {(['ALL', 'PENDING', 'COMPLETED', 'FAILED'] as const).map((status) => (
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
          ) : payouts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600">No payouts found</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Steward
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                {payout.task.steward.image ? (
                                  <ImageWithFallback
                                    src={payout.task.steward.image}
                                    alt={payout.task.steward.name}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                                    {payout.task.steward.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {payout.task.steward.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {payout.task.steward.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{payout.task.category}</div>
                            <div className="text-sm text-gray-500">
                              Client: {payout.task.client.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${payout.amount.toFixed(2)}
                            </div>
                            {payout.paymentMethod && (
                              <div className="text-xs text-gray-500">
                                {payout.paymentMethod}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payout.status, payout.metadata)}
                            {payout.providerTransactionId && (
                              <div className="text-xs text-gray-500 mt-1">
                                ID: {payout.providerTransactionId.substring(0, 8)}...
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payout.createdAt).toLocaleDateString()}
                            <div className="text-xs">
                              {new Date(payout.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/booking/confirmation/${payout.taskId}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {payout.status === 'PENDING' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isProcessing === payout.id}
                                    >
                                      Actions
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPayout(payout)
                                        setAction('approve')
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPayout(payout)
                                        setAction('reject')
                                      }}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPayout(payout)
                                        setAction('freeze')
                                      }}
                                    >
                                      <Lock className="h-4 w-4 mr-2" />
                                      Freeze
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              {payout.metadata?.frozen && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayout(payout)
                                    setAction('unfreeze')
                                    handleAction(payout.id, 'unfreeze')
                                  }}
                                  disabled={isProcessing === payout.id}
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

      {/* Action Modal */}
      {selectedPayout && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {action === 'approve' && 'Approve Payout'}
                  {action === 'reject' && 'Reject Payout'}
                  {action === 'freeze' && 'Freeze Payout'}
                </h2>
                <button
                  onClick={() => {
                    setSelectedPayout(null)
                    setAction('')
                    setNotes('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Payout Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Steward:</span>
                    <span className="text-sm font-medium">{selectedPayout.task.steward.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Task:</span>
                    <span className="text-sm font-medium">{selectedPayout.task.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-medium">${selectedPayout.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={`Enter notes for ${action}ing this payout...`}
                  rows={4}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These notes will be stored in the payout metadata.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPayout(null)
                    setAction('')
                    setNotes('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAction(selectedPayout.id, action)}
                  disabled={isProcessing === selectedPayout.id || !notes.trim()}
                  className={
                    action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-orange-600 hover:bg-orange-700'
                  }
                  title="Requires Google verification"
                >
                  {action === 'approve' && <CheckCircle className="h-4 w-4 mr-2" />}
                  {action === 'reject' && <XCircle className="h-4 w-4 mr-2" />}
                  {action === 'freeze' && <Lock className="h-4 w-4 mr-2" />}
                  {action.charAt(0).toUpperCase() + action.slice(1)} Payout
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
