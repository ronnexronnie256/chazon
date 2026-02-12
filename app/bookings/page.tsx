"use client"

import { useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Clock3, CreditCard } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { useBookingsStore } from '@/store/bookings'
import { useAuthStore } from '@/store/auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PaymentButton } from '@/components/payment-button'

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

export default function BookingsPage() {
  const { isAuthenticated, user } = useAuthStore()
  const { bookings, isLoading, error, fetchBookings } = useBookingsStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings()
    }
  }, [isAuthenticated, fetchBookings])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">My Bookings</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              View and manage all your service bookings
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : isAuthenticated && bookings.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                                    <ImageWithFallback
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
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span className="truncate">{booking.address}</span>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                  {booking.service.steward.image ? (
                                    <ImageWithFallback
                                      src={booking.service.steward.image}
                                      alt={booking.service.steward.name || 'Steward'}
                                      width={32}
                                      height={32}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                                      {booking.service.steward.name ? booking.service.steward.name.charAt(0) : 'S'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm text-gray-500">
                                  Steward: <span className="font-medium text-gray-900">{booking.service.steward.name}</span>
                                </div>
                              </div>
                            </div>
                            {/* Payment Status and Button */}
                            <div className="mt-4 flex items-center justify-between">
                              {booking.isPaid ? (
                                <div className="flex items-center text-sm text-green-600">
                                  <CreditCard className="h-4 w-4 mr-1.5" />
                                  <span className="font-medium">Payment Completed</span>
                                  {booking.paymentTransaction?.paymentMethod && (
                                    <span className="ml-2 text-gray-500">
                                      ({booking.paymentTransaction.paymentMethod})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center text-sm text-yellow-600">
                                  <Clock3 className="h-4 w-4 mr-1.5" />
                                  <span>Payment Pending</span>
                                </div>
                              )}
                              
                              {!booking.isPaid && booking.status === 'PENDING' && user?.role === 'CLIENT' && (
                                <div onClick={(e) => e.preventDefault()}>
                                  <PaymentButton 
                                    taskId={booking.id} 
                                    amount={booking.service.price} 
                                    currency={booking.service.currency || 'UGX'} 
                                  />
                                </div>
                              )}
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No bookings found</h2>
              <p className="text-gray-600 mb-6">
                You haven't made any bookings yet. Browse our services to find the help you need.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chazon-primary hover:bg-chazon-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
              >
                Browse Services
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
//
