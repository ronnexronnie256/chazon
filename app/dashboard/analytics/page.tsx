"use client"

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/store/auth'
import { redirect } from 'next/navigation'
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Star,
  BarChart3,
  Calendar,
  Award,
  Target,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import toast from 'react-hot-toast'

interface WeeklyReport {
  week: string
  weekLabel: string
  earnings: number
  tips: number
  total: number
  completedTasks: number
  tasksWithTips: number
  currency: string
}

interface PerformanceData {
  overview: {
    totalTasks: number
    completedTasks: number
    cancelledTasks: number
    completionRate: number
    averageRating: number
    avgResponseTimeHours: number
    totalEarnings: number
    currency: string
  }
  categoryPerformance: Array<{
    category: string
    taskCount: number
    earnings: number
    averageRating: number
  }>
  trends: {
    taskGrowth: number
    earningsGrowth: number
  }
  recentPerformance: {
    tasksCompleted: number
    earnings: number
    period: string
  }
}

export default function StewardAnalyticsPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  const [performance, setPerformance] = useState<PerformanceData | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      redirect('/auth/signin')
    }

    if (user.role !== 'STEWARD') {
      redirect('/dashboard')
    }

    fetchAnalytics()
  }, [isAuthenticated, user])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [weeklyRes, performanceRes] = await Promise.all([
        fetch('/api/steward/analytics/weekly?weeks=8'),
        fetch('/api/steward/analytics/performance'),
      ])

      if (weeklyRes.ok) {
        const weeklyData = await weeklyRes.json()
        setWeeklyReports(weeklyData.data || [])
      }

      if (performanceRes.ok) {
        const performanceData = await performanceRes.json()
        setPerformance(performanceData.data || null)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'UGX') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
            <p className="text-xl text-gray-600">Track your performance and earnings</p>
          </div>

          {/* Performance Overview */}
          {performance && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(performance.overview.totalEarnings, performance.overview.currency)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {performance.overview.completionRate.toFixed(1)}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {performance.overview.averageRating.toFixed(1)}
                      <Star className="inline h-5 w-5 text-yellow-500 ml-1" />
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {performance.overview.avgResponseTimeHours.toFixed(1)}h
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </Card>
            </div>
          )}

          {/* Weekly Reports */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Weekly Earnings</h2>
                <p className="text-sm text-gray-600 mt-1">Last 8 weeks breakdown</p>
              </div>
              <BarChart3 className="h-6 w-6 text-gray-400" />
            </div>

            {weeklyReports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasks Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earnings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tips
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyReports.map((report) => (
                      <tr key={report.week} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.weekLabel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.completedTasks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(report.earnings, report.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(report.tips, report.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(report.total, report.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No weekly data available yet
              </div>
            )}
          </Card>

          {/* Category Performance */}
          {performance && performance.categoryPerformance.length > 0 && (
            <Card className="p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Category Performance</h2>
                  <p className="text-sm text-gray-600 mt-1">Earnings by service category</p>
                </div>
                <Target className="h-6 w-6 text-gray-400" />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earnings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performance.categoryPerformance.map((cat) => (
                      <tr key={cat.category} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cat.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cat.taskCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(cat.earnings, performance.overview.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cat.averageRating > 0 ? (
                            <span className="flex items-center">
                              {cat.averageRating.toFixed(1)}
                              <Star className="h-4 w-4 text-yellow-500 ml-1" />
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Trends */}
          {performance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Task Growth</h3>
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">
                    {performance.trends.taskGrowth > 0 ? '+' : ''}
                    {performance.trends.taskGrowth.toFixed(1)}%
                  </span>
                  <span className="ml-2 text-sm text-gray-600">vs previous period</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {performance.recentPerformance.tasksCompleted} tasks completed in last 30 days
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Earnings Growth</h3>
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">
                    {performance.trends.earningsGrowth > 0 ? '+' : ''}
                    {performance.trends.earningsGrowth.toFixed(1)}%
                  </span>
                  <span className="ml-2 text-sm text-gray-600">vs previous period</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {formatCurrency(performance.recentPerformance.earnings, performance.overview.currency)} earned in last 30 days
                </p>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

