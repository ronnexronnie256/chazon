"use client"

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { 
  Briefcase, 
  Search, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  MessageSquare,
  Star,
  Download
} from 'lucide-react'

interface Task {
  id: string
  status: string
  category: string
  description: string | null
  address: string
  agreedPrice: number
  currency: string
  scheduledStart: string
  scheduledEnd: string | null
  actualStart: string | null
  actualEnd: string | null
  createdAt: string
  updatedAt: string
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
  payment: {
    status: string
    amount: number
    completedAt: string
  } | null
  counts: {
    messages: number
    reviews: number
  }
}

export default function AdminTasksPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
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

    fetchTasks()
  }, [isAuthenticated, statusFilter, page, router, user])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('page', page.toString())
      
      const response = await fetch(`/api/admin/tasks?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks')
      }

      setTasks(data.data || [])
      setTotalPages(data.meta?.pagination?.totalPages || 1)
    } catch (error: any) {
      console.error('Error fetching tasks:', error)
      toast.error(error.message || 'Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchTasks()
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Open
          </span>
        )
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Assigned
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Briefcase className="h-3 w-3 mr-1" />
            In Progress
          </span>
        )
      case 'DONE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Done
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        )
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Disputed
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Task Monitoring</h1>
              <p className="text-gray-600">Monitor and manage all tasks on the platform</p>
            </div>
            <button
              onClick={() => {
                const url = `/api/admin/export?type=tasks`
                const a = document.createElement('a')
                a.href = url
                a.download = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`
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

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by category or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>
              <div className="flex gap-2 flex-wrap">
                {(['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'DISPUTED'] as const).map((status) => (
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
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600">No tasks found</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{task.category}</h3>
                          {getStatusBadge(task.status)}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {task.currency} {task.agreedPrice.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {task.counts.messages} messages
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {task.counts.reviews} reviews
                          </div>
                        </div>
                      </div>
                      <Link href={`/booking/confirmation/${task.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Client</h4>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                            {task.client.image ? (
                              <ImageWithFallback
                                src={task.client.image}
                                alt={task.client.name}
                                width={32}
                                height={32}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                {task.client.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{task.client.name}</p>
                            <p className="text-xs text-gray-500">{task.client.email}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Steward</h4>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                            {task.steward.image ? (
                              <ImageWithFallback
                                src={task.steward.image}
                                alt={task.steward.name}
                                width={32}
                                height={32}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                                {task.steward.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{task.steward.name}</p>
                            <p className="text-xs text-gray-500">{task.steward.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Scheduled</p>
                        <p className="font-medium">{new Date(task.scheduledStart).toLocaleString()}</p>
                      </div>
                      {task.actualStart && (
                        <div>
                          <p className="text-gray-500">Started</p>
                          <p className="font-medium">{new Date(task.actualStart).toLocaleString()}</p>
                        </div>
                      )}
                      {task.actualEnd && (
                        <div>
                          <p className="text-gray-500">Completed</p>
                          <p className="font-medium">{new Date(task.actualEnd).toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">Payment</p>
                        {task.payment ? (
                          <p className={`font-medium ${
                            task.payment.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {task.payment.status}
                          </p>
                        ) : (
                          <p className="text-gray-400">Not paid</p>
                        )}
                      </div>
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
      <Footer />
    </div>
  )
}

