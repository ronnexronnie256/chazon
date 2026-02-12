"use client"

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Clock3, User, Settings, BookOpen, Star, Wallet, CalendarDays, TrendingUp, Lightbulb } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useBookingsStore } from '@/store/bookings'
import Image from 'next/image'

function useUserData() {
  const { isAuthenticated, user } = useAuthStore()
  const { bookings } = useBookingsStore()
  return { isAuthenticated, user, bookings: bookings.slice(0, 3), isSteward: !!user?.isSteward }
}

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

interface SkillRecommendation {
  category: string
  demand: number
  unassignedTasks: number
  averagePrice: number
  score: number
  reason: string
}

export default function DashboardPage() {
  const { isAuthenticated, user, bookings, isSteward } = useUserData()
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [walletCurrency, setWalletCurrency] = useState<string>('UGX')
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [skillRecommendations, setSkillRecommendations] = useState<SkillRecommendation[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  useEffect(() => {
    if (isAuthenticated && isSteward && user?.role === 'STEWARD') {
      fetchWalletBalance()
      fetchSkillRecommendations()
    }
  }, [isAuthenticated, isSteward, user])

  const fetchSkillRecommendations = async () => {
    try {
      setLoadingRecommendations(true)
      const response = await fetch('/api/steward/recommendations/skills')
      if (response.ok) {
        const data = await response.json()
        setSkillRecommendations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching skill recommendations:', error)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const fetchWalletBalance = async () => {
    try {
      setLoadingWallet(true)
      const response = await fetch('/api/wallet/balance')
      if (response.ok) {
        const data = await response.json()
        setWalletBalance(data.balance?.availableBalance || 0)
        setWalletCurrency(data.balance?.currency || 'UGX')
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
    } finally {
      setLoadingWallet(false)
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

  if (!isAuthenticated || !user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {user.name}! Here's an overview of your account.
              </p>
            </div>
            {isSteward && (
              <Link href="/dashboard/services/create">
                <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-chazon-primary text-primary-foreground hover:bg-chazon-primary/90 h-10 px-4 py-2 text-white shadow-sm">
                  + Add Service
                </div>
              </Link>
            )}
          </div>

          {/* Quick Stats */}
          <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${isSteward ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} mb-8`}>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Profile</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{isSteward ? 'Steward' : 'Customer'}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/profile" className="font-medium text-chazon-primary hover:text-chazon-primary-dark">
                    View profile
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Bookings</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{bookings.length} Recent</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/bookings" className="font-medium text-chazon-primary hover:text-chazon-primary-dark">
                    View all bookings
                  </Link>
                </div>
              </div>
            </div>

            {isSteward && (
              <>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Wallet className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Wallet Balance</dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {loadingWallet ? '...' : walletBalance !== null ? formatCurrency(walletBalance, walletCurrency) : '—'}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/dashboard/wallet" className="font-medium text-chazon-primary hover:text-chazon-primary-dark">
                        View wallet
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Star className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Rating</dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {user.rating?.toFixed(1) || 'New'}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/profile" className="font-medium text-chazon-primary hover:text-chazon-primary-dark">
                        View reviews
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Settings className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Account</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">Settings</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/settings" className="font-medium text-chazon-primary hover:text-chazon-primary-dark">
                    Manage account
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Bookings</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Your most recent service bookings.</p>
              </div>
              <Link
                href="/bookings"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-chazon-primary bg-chazon-primary-light hover:bg-chazon-primary-light/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
              >
                View All
              </Link>
            </div>

            {bookings.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {bookings.map((booking) => {
                  // Format date for display
                  const formattedDate = new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })

                  return (
                    <li key={booking.id}>
                      <Link href={`/booking/confirmation/${booking.id}`}>
                        <div className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-200 overflow-hidden">
                                  {booking.service.images && booking.service.images.length > 0 ? (
                                    <Image
                                      src={booking.service.images[0]}
                                      alt={booking.service.title}
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
                                    {booking.service.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {booking.service.category.name}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                {getStatusBadge(booking.status)}
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
                                  {booking.scheduledTime}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">You don't have any bookings yet.</p>
                <Link
                  href="/services"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chazon-primary hover:bg-chazon-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
                >
                  Browse Services
                </Link>
              </div>
            )}
          </div>

          {/* Skill Recommendations */}
          {isSteward && skillRecommendations.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                    Skill Recommendations
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Based on market demand and opportunities
                  </p>
                </div>
                <Link
                  href="/dashboard/analytics"
                  className="text-sm text-chazon-primary hover:text-chazon-primary-dark"
                >
                  View Analytics →
                </Link>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skillRecommendations.slice(0, 3).map((rec) => (
                    <div
                      key={rec.category}
                      className="border border-gray-200 rounded-lg p-4 hover:border-chazon-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rec.category}</h3>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Demand:</span>
                          <span className="font-medium">{rec.demand} tasks</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unassigned:</span>
                          <span className="font-medium">{rec.unassignedTasks} tasks</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Price:</span>
                          <span className="font-medium">
                            {formatCurrency(rec.averagePrice, walletCurrency)}
                          </span>
                        </div>
                      </div>
                      <Link
                        href="/dashboard/services/create"
                        className="mt-3 inline-block text-sm text-chazon-primary hover:text-chazon-primary-dark font-medium"
                      >
                        Add Service →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Common tasks you might want to perform.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chazon-primary hover:bg-chazon-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
                >
                  Browse Services
                </Link>
                {isSteward ? (
                  <>
                    <Link
                      href="/dashboard/services"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chazon-primary hover:bg-chazon-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
                    >
                      My Services
                    </Link>
                    <Link
                      href="/dashboard/services/create"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add New Service
                    </Link>
                    <Link
                      href="/dashboard/wallet"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Wallet & Earnings
                    </Link>
                    <Link
                      href="/dashboard/availability"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Manage Availability
                    </Link>
                    <Link
                      href="/dashboard/analytics"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Analytics
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/become-steward"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chazon-primary hover:bg-chazon-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
                  >
                    Become a Steward
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
                >
                  Account Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
