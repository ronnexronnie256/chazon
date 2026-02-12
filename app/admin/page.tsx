"use client"

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Briefcase, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  UserCheck,
  FileText,
  Download,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface DashboardMetrics {
  totalUsers: number
  totalStewards: number
  totalClients: number
  totalTasks: number
  pendingTasks: number
  activeTasks: number
  completedTasks: number
  totalRevenue: number
  platformFees: number
  pendingDisputes: number
  pendingApplications: number
}

interface TimeSeriesData {
  date: string
  users: number
  tasks: number
  revenue: number
  platformFees: number
}

interface AnalyticsData {
  timeSeries: TimeSeriesData[]
  summary: {
    totalUsers: number
    totalTasks: number
    completedTasks: number
    activeTasks: number
    totalRevenue: number
    totalPlatformFees: number
    userGrowthRate: number
    taskGrowthRate: number
    revenueGrowthRate: number
  }
  period: number
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30')

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

    fetchMetrics()
    fetchAnalytics()
  }, [isAuthenticated, router, user])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchAnalytics()
    }
  }, [analyticsPeriod, isAuthenticated, user])

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/metrics')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch metrics')
      }

      setMetrics(data.data)
    } catch (error: any) {
      console.error('Error fetching metrics:', error)
      toast.error(error.message || 'Failed to load dashboard metrics')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true)
      const response = await fetch(`/api/admin/analytics?period=${analyticsPeriod}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      setAnalytics(data.data)
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      toast.error(error.message || 'Failed to load analytics')
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}`)
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${type}_export.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Export downloaded successfully')
    } catch (error: any) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (analyticsPeriod === '7') {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatCurrency = (amount: number, currency: string = 'UGX') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null
  }

  const statCards = [
    {
      title: 'Total Users',
      value: metrics?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/users'
    },
    {
      title: 'Active Stewards',
      value: metrics?.totalStewards || 0,
      icon: UserCheck,
      color: 'bg-green-500',
      link: '/admin/users?role=STEWARD'
    },
    {
      title: 'Total Tasks',
      value: metrics?.totalTasks || 0,
      icon: Briefcase,
      color: 'bg-purple-500',
      link: '/admin/tasks'
    },
    {
      title: 'Pending Disputes',
      value: metrics?.pendingDisputes || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      link: '/admin/disputes'
    },
    {
      title: 'Pending Applications',
      value: metrics?.pendingApplications || 0,
      icon: FileText,
      color: 'bg-yellow-500',
      link: '/admin/stewards?status=PENDING'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics?.totalRevenue || 0, 'UGX'),
      icon: DollarSign,
      color: 'bg-indigo-500',
      link: '/admin/payouts'
    }
  ]

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage all users and stewards',
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700'
    },
    {
      title: 'Monitor Tasks',
      description: 'Track and manage all tasks',
      icon: Briefcase,
      link: '/admin/tasks',
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700'
    },
    {
      title: 'Resolve Disputes',
      description: 'Handle task disputes',
      icon: AlertTriangle,
      link: '/admin/disputes',
      color: 'bg-red-50 hover:bg-red-100 text-red-700'
    },
    {
      title: 'Manage Payouts',
      description: 'Control steward payouts',
      icon: DollarSign,
      link: '/admin/payouts',
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
    },
    {
      title: 'Review Applications',
      description: 'Approve steward applications',
      icon: UserCheck,
      link: '/admin/stewards',
      color: 'bg-green-50 hover:bg-green-100 text-green-700'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Overview and management of the Chazon platform</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <Link
                      key={card.title}
                      href={card.link}
                      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                          <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                        </div>
                        <div className={`${card.color} p-3 rounded-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Task Status Overview */}
              <div className="bg-white rounded-lg shadow mb-8 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Status Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">{metrics?.pendingTasks || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Active</p>
                        <p className="text-2xl font-bold text-gray-900">{metrics?.activeTasks || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-gray-900">{metrics?.completedTasks || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Section */}
              <div className="bg-white rounded-lg shadow mb-8 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Analytics & Trends</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={analyticsPeriod}
                      onChange={(e) => setAnalyticsPeriod(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="365">Last year</option>
                    </select>
                    <button
                      onClick={() => handleExport('transactions')}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Export Data
                    </button>
                  </div>
                </div>

                {isLoadingAnalytics ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : analytics ? (
                  <>
                    {/* Growth Rate Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">User Growth</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {analytics.summary.totalUsers}
                          </p>
                          {analytics.summary.userGrowthRate !== 0 && (
                            <span className={`text-sm font-medium ${
                              analytics.summary.userGrowthRate > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {analytics.summary.userGrowthRate > 0 ? '↑' : '↓'} {Math.abs(analytics.summary.userGrowthRate).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Task Growth</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {analytics.summary.totalTasks}
                          </p>
                          {analytics.summary.taskGrowthRate !== 0 && (
                            <span className={`text-sm font-medium ${
                              analytics.summary.taskGrowthRate > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {analytics.summary.taskGrowthRate > 0 ? '↑' : '↓'} {Math.abs(analytics.summary.taskGrowthRate).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Revenue Growth</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(analytics.summary.totalRevenue, 'UGX')}
                          </p>
                          {analytics.summary.revenueGrowthRate !== 0 && (
                            <span className={`text-sm font-medium ${
                              analytics.summary.revenueGrowthRate > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {analytics.summary.revenueGrowthRate > 0 ? '↑' : '↓'} {Math.abs(analytics.summary.revenueGrowthRate).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analytics.timeSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={formatDate}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value: number | undefined) => value ? formatCurrency(value, 'UGX') : ''}
                            labelFormatter={(label) => `Date: ${formatDate(label)}`}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#6366f1" 
                            fill="#6366f1" 
                            fillOpacity={0.6}
                            name="Revenue"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="platformFees" 
                            stroke="#8b5cf6" 
                            fill="#8b5cf6" 
                            fillOpacity={0.4}
                            name="Platform Fees"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Users and Tasks Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">New Users</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={analytics.timeSeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={formatDate}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              labelFormatter={(label) => `Date: ${formatDate(label)}`}
                            />
                            <Bar dataKey="users" fill="#3b82f6" name="New Users" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">New Tasks</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={analytics.timeSeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={formatDate}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              labelFormatter={(label) => `Date: ${formatDate(label)}`}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="tasks" 
                              stroke="#8b5cf6" 
                              strokeWidth={2}
                              name="New Tasks"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Link
                        key={action.title}
                        href={action.link}
                        className={`${action.color} p-4 rounded-lg transition-colors`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-6 w-6 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold mb-1">{action.title}</h3>
                            <p className="text-sm opacity-80">{action.description}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

