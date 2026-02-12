"use client"

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { notFound, useParams, useRouter } from 'next/navigation'
import { CheckCircle, Calendar, MapPin, Clock, FileText, Play, Check, X } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import Link from 'next/link'
import { ApiClient } from '@/lib/api-client'
import { Booking } from '@/types/booking'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuthStore } from '@/store/auth'
import { Chat } from '@/components/ui/chat'
import { ReviewForm } from '@/components/ui/review-form'
import { ReviewCard } from '@/components/ui/review-card'
import toast from 'react-hot-toast'

export default function BookingConfirmationPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useAuthStore()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [userReview, setUserReview] = useState<any | null>(null)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [showTipModal, setShowTipModal] = useState(false)
  const [tipAmount, setTipAmount] = useState<string>('')

  useEffect(() => {
    async function fetchBooking() {
      try {
        const response = await ApiClient.bookings.get(id)
        setBooking(response)
      } catch (err) {
        console.error('Failed to fetch booking:', err)
        setError('Failed to load booking details')
      } finally {
        setIsLoading(false)
      }
    }

    async function fetchReviews() {
      if (!id || !user) return
      setLoadingReviews(true)
      try {
        const response = await fetch(`/api/reviews?taskId=${id}`)
        const data = await response.json()
        if (data.success) {
          setReviews(data.data || [])
          // Find user's review
          const userRev = data.data?.find((r: any) => r.reviewerId === user.id)
          setUserReview(userRev || null)
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err)
      } finally {
        setLoadingReviews(false)
      }
    }

    if (id) {
      fetchBooking()
      fetchReviews()
    }
  }, [id, user])

  const handleTaskAction = async (action: 'accept' | 'start' | 'complete' | 'confirm' | 'cancel', extraData?: any) => {
    if (!booking || isUpdating) return

    setIsUpdating(true)
    try {
      const response = await ApiClient.bookings.updateAction(id, action, extraData)
      if (response.success) {
        setBooking(response.data)
        toast.success(getActionMessage(action))
        // Refresh the page data
        const updated = await ApiClient.bookings.get(id)
        setBooking(updated)
        // Close tip modal if it was open
        if (action === 'confirm' && showTipModal) {
          setShowTipModal(false)
          setTipAmount('')
        }
      } else {
        toast.error(response.error || 'Failed to update task')
      }
    } catch (err: any) {
      console.error('Failed to update task:', err)
      toast.error(err.message || 'Failed to update task')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleConfirmWithTip = () => {
    if (tipAmount && parseFloat(tipAmount) > 0) {
      handleTaskAction('confirm', { tipAmount: parseFloat(tipAmount) })
    } else {
      handleTaskAction('confirm')
    }
  }

  const getActionMessage = (action: string): string => {
    switch (action) {
      case 'accept': return 'Task accepted successfully!'
      case 'start': return 'Task started!'
      case 'complete': return 'Task marked as complete!'
      case 'confirm': return 'Task confirmed and payment released!'
      case 'cancel': return 'Task cancelled'
      default: return 'Task updated'
    }
  }

  const getTaskActions = () => {
    if (!booking || !user) return null

    // Check if user is client or steward using the booking's stewardId/clientId
    const isClient = (booking as any).clientId === user.id
    const isSteward = (booking as any).stewardId === user.id
    const status = booking.status

    const actions = []

    // Steward actions
    if (isSteward || user?.role === 'ADMIN') {
      if (status === 'PENDING') {
        actions.push(
          <button
            key="accept"
            onClick={() => handleTaskAction('accept')}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept Task
          </button>
        )
      }
      if (status === 'CONFIRMED') {
        actions.push(
          <button
            key="start"
            onClick={() => handleTaskAction('start')}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Task
          </button>
        )
      }
      if (status === 'IN_PROGRESS') {
        actions.push(
          <button
            key="complete"
            onClick={() => handleTaskAction('complete')}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4 mr-2" />
            Mark Complete
          </button>
        )
      }
    }

    // Client actions
    if (isClient || user?.role === 'ADMIN') {
      // Only show "Confirm & Release Payment" button if:
      // 1. Status is COMPLETED (task is done)
      // 2. Payment has been made (isPaid)
      // 3. Payment has NOT been released yet (isPaymentReleased is false)
      if (status === 'COMPLETED' && booking.isPaid && !booking.isPaymentReleased) {
        actions.push(
          <button
            key="confirm"
            onClick={() => setShowTipModal(true)}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Requires Google verification"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm & Release Payment
          </button>
        )
      }
      if (status === 'PENDING' || status === 'CONFIRMED') {
        actions.push(
          <button
            key="cancel"
            onClick={() => {
              if (confirm('Are you sure you want to cancel this task?')) {
                handleTaskAction('cancel')
              }
            }}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Task
          </button>
        )
      }
    }

    return actions.length > 0 ? actions : null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
             <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
             <p className="text-gray-600 mb-6">The booking you are looking for does not exist or could not be loaded.</p>
             <Link href="/bookings" className="text-chazon-primary hover:underline">Return to My Bookings</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const formattedDate = new Date(booking.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Confirmation Header */}
            <div className="bg-chazon-primary p-6 text-white text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16" />
              </div>
              <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
              <p className="text-lg mt-2">Your service has been successfully booked</p>
            </div>

            {/* Booking Details */}
            <div className="p-6">
              <div className="border-b pb-6 mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Booking Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-chazon-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-chazon-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium text-gray-900">{booking.scheduledTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-chazon-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{booking.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-chazon-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="font-medium text-gray-900">{booking.notes || 'No notes provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="border-b pb-6 mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Service Details</h2>
                <div className="flex items-start space-x-4">
                  <div className="h-16 w-16 rounded-md bg-gray-200 flex-shrink-0 overflow-hidden">
                    {booking.service.images && booking.service.images.length > 0 ? (
                      <ImageWithFallback
                        src={booking.service.images[0]}
                        alt={booking.service.title}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{booking.service.title}</h3>
                    <p className="text-sm text-gray-500">{booking.service.category.name}</p>
                    <p className="text-chazon-primary font-semibold mt-1">
                      ${booking.service.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Steward Details */}
              <div className="border-b pb-6 mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Steward Details</h2>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {booking.service.steward.image ? (
                      <ImageWithFallback
                        src={booking.service.steward.image}
                        alt={booking.service.steward.name || 'Steward'}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                        {booking.service.steward.name?.charAt(0) || 'S'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{booking.service.steward.name}</h3>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-600 ml-1">
                          {booking.service.steward.rating?.toFixed(1) || 'New'} ({booking.service.steward.totalReviews || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Actions */}
              {getTaskActions() && (
                <div className="border-t pt-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Task Actions</h2>
                  {isUpdating ? (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner />
                      <span className="ml-3 text-gray-600">Processing action...</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {getTaskActions()}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Section */}
              {user && booking && booking.status === 'COMPLETED' && (
                <div className="border-t pt-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Reviews</h2>
                  
                  {/* User's Review Form (if not reviewed yet) */}
                  {!userReview && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      {(() => {
                        const isClient = (booking as any).clientId === user.id
                        const isSteward = (booking as any).stewardId === user.id
                        const revieweeId = isClient 
                          ? (booking as any).stewardId 
                          : (booking as any).clientId
                        const revieweeName = isClient
                          ? booking.service.steward.name
                          : (booking as any).client?.name || 'Client'
                        
                        return (
                          <ReviewForm
                            taskId={id}
                            revieweeId={revieweeId}
                            revieweeName={revieweeName}
                            onReviewSubmitted={async () => {
                              // Refresh reviews
                              try {
                                const response = await fetch(`/api/reviews?taskId=${id}`)
                                const data = await response.json()
                                if (data.success) {
                                  setReviews(data.data || [])
                                  const userRev = data.data?.find((r: any) => r.reviewerId === user.id)
                                  setUserReview(userRev || null)
                                }
                              } catch (err) {
                                console.error('Failed to refresh reviews:', err)
                              }
                            }}
                          />
                        )
                      })()}
                    </div>
                  )}

                  {/* Display User's Review */}
                  {userReview && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-3">Your Review</h3>
                      <ReviewCard review={{
                        reviewer: {
                          name: userReview.reviewer.name,
                          image: userReview.reviewer.image,
                        },
                        rating: userReview.rating,
                        comment: userReview.comment,
                        createdAt: userReview.createdAt,
                      }} />
                    </div>
                  )}

                  {/* Display Other Reviews */}
                  {reviews.filter((r: any) => r.reviewerId !== user.id).length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-3">
                        Other Reviews ({reviews.filter((r: any) => r.reviewerId !== user.id).length})
                      </h3>
                      <div className="space-y-4">
                        {reviews
                          .filter((r: any) => r.reviewerId !== user.id)
                          .map((review: any) => (
                            <ReviewCard
                              key={review.id}
                              review={{
                                reviewer: {
                                  name: review.reviewer.name,
                                  image: review.reviewer.image,
                                },
                                rating: review.rating,
                                comment: review.comment,
                                createdAt: review.createdAt,
                              }}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {reviews.length === 0 && userReview && (
                    <p className="text-gray-500 text-center py-4">
                      No other reviews yet.
                    </p>
                  )}
                </div>
              )}

              {/* Chat Section */}
              {user && (
                <div className="border-t pt-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Messages</h2>
                  <Chat taskId={id} currentUserId={user.id} />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/bookings"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
                >
                  View All Bookings
                </Link>
                <Link
                  href={`/service/${booking.service.id}`}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-chazon-primary hover:bg-chazon-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
                >
                  View Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Tip Modal (FR-19: Tips support) */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add a Tip (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Show your appreciation by adding a tip. Tips go 100% to the steward.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tip Amount (UGX)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chazon-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty or 0 to confirm without a tip
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTipModal(false)
                  setTipAmount('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWithTip}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Processing...' : 'Confirm & Release Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
