"use client"

import { useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Clock3, Play, Check, Filter, X } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { useBookingsStore } from '@/store/bookings'
import { useAuthStore } from '@/store/auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ApiClient } from '@/lib/api-client'
import { useState } from 'react'
import toast from 'react-hot-toast'

function getStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmed
        </span>
      )
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      )
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </span>
      )
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Play className="h-3 w-3 mr-1" />
          In Progress
        </span>
      )
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock3 className="h-3 w-3 mr-1" />
          Pending
        </span>
      )
  }
}

export default function StewardTasksPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [tasks, setTasks] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([]) // Store all tasks for filtering
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks()
    }
  }, [isAuthenticated])

  useEffect(() => {
    applyFilters()
  }, [statusFilter, categoryFilter, dateFrom, dateTo, allTasks])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const tasks = await ApiClient.bookings.list('steward')
      setAllTasks(tasks)
      setTasks(tasks)
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err)
      setError(err.message || 'Failed to fetch tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allTasks]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => {
        const statusMap: Record<string, string> = {
          pending: 'PENDING',
          confirmed: 'CONFIRMED',
          in_progress: 'IN_PROGRESS',
          completed: 'COMPLETED',
          cancelled: 'CANCELLED',
        }
        return task.status === statusMap[statusFilter]
      })
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((task) => task.service.category.name.toLowerCase() === categoryFilter.toLowerCase())
    }

    // Date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter((task) => new Date(task.scheduledDate) >= fromDate)
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter((task) => new Date(task.scheduledDate) <= toDate)
    }

    setTasks(filtered)
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setCategoryFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const getUniqueCategories = () => {
    const categories = new Set<string>()
    allTasks.forEach((task) => {
      if (task.service?.category?.name) {
        categories.add(task.service.category.name)
      }
    })
    return Array.from(categories).sort()
  }

  const handleTaskAction = async (taskId: string, action: 'accept' | 'start' | 'complete') => {
    if (isUpdating) return

    setIsUpdating(taskId)
    try {
      const response = await ApiClient.bookings.updateAction(taskId, action)
      if (response.success) {
        toast.success(getActionMessage(action))
        // Refresh tasks
        await fetchTasks()
      } else {
        toast.error(response.error || 'Failed to update task')
      }
    } catch (err: any) {
      console.error('Failed to update task:', err)
      toast.error(err.message || 'Failed to update task')
    } finally {
      setIsUpdating(null)
    }
  }

  const getActionMessage = (action: string): string => {
    switch (action) {
      case 'accept': return 'Task accepted successfully!'
      case 'start': return 'Task started!'
      case 'complete': return 'Task marked as complete!'
      default: return 'Task updated'
    }
  }

  const getTaskActionButton = (task: any) => {
    const status = task.status
    const taskId = task.id

    if (status === 'PENDING') {
      return (
        <button
          onClick={() => handleTaskAction(taskId, 'accept')}
          disabled={isUpdating === taskId}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Accept
        </button>
      )
    }

    if (status === 'CONFIRMED') {
      return (
        <button
          onClick={() => handleTaskAction(taskId, 'start')}
          disabled={isUpdating === taskId}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="h-3 w-3 mr-1" />
          Start
        </button>
      )
    }

    if (status === 'IN_PROGRESS') {
      return (
        <button
          onClick={() => handleTaskAction(taskId, 'complete')}
          disabled={isUpdating === taskId}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="h-3 w-3 mr-1" />
          Complete
        </button>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">My Tasks</h1>
                <p className="text-xl text-gray-600">
                  Manage and track all your assigned service tasks
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chazon-primary"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chazon-primary"
                    >
                      <option value="all">All Categories</option>
                      {getUniqueCategories().map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chazon-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chazon-primary"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="text-sm text-gray-600 mb-4">
              Showing {tasks.length} of {allTasks.length} tasks
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : isAuthenticated && tasks.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {tasks.map((task) => {
                  // Format date for display
                  const formattedDate = new Date(task.scheduledDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })

                  return (
                    <li key={task.id}>
                      <Link href={`/booking/confirmation/${task.id}`}>
                        <div className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-200 overflow-hidden">
                                  {task.service.images && task.service.images.length > 0 ? (
                                    <ImageWithFallback
                                      src={task.service.images[0]}
                                      alt={task.service.title}
                                      width={40}
                                      height={40}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                                      No Image
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-chazon-primary">
                                    {task.service.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {task.service.category.name}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                                {getStatusBadge(task.status)}
                                {getTaskActionButton(task) && (
                                  <div onClick={(e) => e.preventDefault()}>
                                    {getTaskActionButton(task)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  {formattedDate}
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  {task.scheduledTime}
                                </div>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span className="truncate">{task.address}</span>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-end">
                              <div className="text-sm font-semibold text-chazon-primary">
                                {task.service.currency} {task.service.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12 bg-white shadow sm:rounded-lg">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No tasks found</h2>
              <p className="text-gray-600 mb-6">
                You don't have any assigned tasks yet. Tasks will appear here when clients book your services.
              </p>
              <Link
                href="/dashboard/services/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chazon-primary hover:bg-chazon-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
              >
                Create Service Offering
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

