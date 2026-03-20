'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Play,
  Check,
  X,
  MessageSquare,
  Star,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { UserAvatar } from '@/components/ui/user-avatar';
import Link from 'next/link';
import { ApiClient } from '@/lib/api-client';
import { Booking } from '@/types/booking';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthStore } from '@/store/auth';
import { Chat } from '@/components/ui/chat';
import { ReviewForm } from '@/components/ui/review-form';
import { ReviewCard } from '@/components/ui/review-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

const BOOKING_STEPS = [
  { key: 'PENDING', label: 'Requested', icon: FileText },
  { key: 'CONFIRMED', label: 'Confirmed', icon: Check },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: Play },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'CONFIRMED':
      return 1;
    case 'IN_PROGRESS':
      return 2;
    case 'COMPLETED':
      return 3;
    case 'CANCELLED':
      return -1;
    default:
      return 0;
  }
}

function BookingTimeline({ status }: { status: string }) {
  const currentStep = getStepIndex(status);
  const isCancelled = status === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-full">
            <X className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-800">Booking Cancelled</p>
            <p className="text-sm text-red-600">
              This booking has been cancelled
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {BOOKING_STEPS.map((step, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < BOOKING_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded transition-all duration-300 ${
                    currentStep > index ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userReview, setUserReview] = useState<any | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('');

  useEffect(() => {
    async function fetchBooking() {
      try {
        const response = await ApiClient.bookings.get(id);
        setBooking(response);
      } catch (err) {
        console.error('Failed to fetch booking:', err);
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchReviews() {
      if (!id || !user) return;
      setLoadingReviews(true);
      try {
        const response = await fetch(`/api/reviews?taskId=${id}`);
        const data = await response.json();
        if (data.success) {
          setReviews(data.data || []);
          const userRev = data.data?.find((r: any) => r.reviewerId === user.id);
          setUserReview(userRev || null);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    }

    if (id) {
      fetchBooking();
      fetchReviews();
    }
  }, [id, user]);

  const handleTaskAction = async (
    action: 'accept' | 'start' | 'complete' | 'confirm' | 'cancel',
    extraData?: any
  ) => {
    if (!booking || isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await ApiClient.bookings.updateAction(
        id,
        action,
        extraData
      );
      if (response.success) {
        setBooking(response.data);
        toast.success(getActionMessage(action));
        const updated = await ApiClient.bookings.get(id);
        setBooking(updated);
        if (action === 'confirm' && showTipModal) {
          setShowTipModal(false);
          setTipAmount('');
        }
      } else {
        toast.error(response.error || 'Failed to update task');
      }
    } catch (err: any) {
      console.error('Failed to update task:', err);
      toast.error(err.message || 'Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmWithTip = () => {
    if (tipAmount && parseFloat(tipAmount) > 0) {
      handleTaskAction('confirm', { tipAmount: parseFloat(tipAmount) });
    } else {
      handleTaskAction('confirm');
    }
  };

  const getActionMessage = (action: string): string => {
    switch (action) {
      case 'accept':
        return 'Task accepted! The client has been notified.';
      case 'start':
        return 'Task started! Good luck!';
      case 'complete':
        return 'Task marked complete! Awaiting client confirmation.';
      case 'confirm':
        return 'Task confirmed and payment released!';
      case 'cancel':
        return 'Task cancelled';
      default:
        return 'Task updated';
    }
  };

  const getTaskActions = () => {
    if (!booking || !user) return null;

    const isClient = (booking as any).clientId === user.id;
    const isSteward = (booking as any).stewardId === user.id;
    const status = booking.status;

    const actions = [];

    if (isSteward || user?.role === 'ADMIN') {
      if (status === 'PENDING') {
        actions.push(
          <Button
            key="accept"
            onClick={() => handleTaskAction('accept')}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept Task
          </Button>
        );
      }
      if (status === 'CONFIRMED') {
        actions.push(
          <Button
            key="start"
            onClick={() => handleTaskAction('start')}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Task
          </Button>
        );
      }
      if (status === 'IN_PROGRESS') {
        actions.push(
          <Button
            key="complete"
            onClick={() => handleTaskAction('complete')}
            disabled={isUpdating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Mark Complete
          </Button>
        );
      }
    }

    if (isClient || user?.role === 'ADMIN') {
      if (
        status === 'COMPLETED' &&
        booking.isPaid &&
        !booking.isPaymentReleased
      ) {
        actions.push(
          <Button
            key="confirm"
            onClick={() => setShowTipModal(true)}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm & Release Payment
          </Button>
        );
      }
      if (status === 'PENDING' || status === 'CONFIRMED') {
        actions.push(
          <Button
            key="cancel"
            variant="outline"
            onClick={() => {
              if (confirm('Are you sure you want to cancel this task?')) {
                handleTaskAction('cancel');
              }
            }}
            disabled={isUpdating}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        );
      }
    }

    return actions.length > 0 ? actions : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The booking you are looking for does not exist.
            </p>
            <Link
              href="/bookings"
              className="text-chazon-primary hover:underline"
            >
              Return to My Bookings
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formattedDate = new Date(booking.scheduledDate).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const isClient = (booking as any).clientId === user?.id;
  const isSteward = (booking as any).stewardId === user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6">
            <Link
              href="/bookings"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
              Back to Bookings
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Booking Details
                </h1>
                <p className="text-gray-500 mt-1">
                  ID: {booking.id.slice(0, 8)}
                </p>
              </div>
              <Badge
                variant={
                  booking.status === 'COMPLETED'
                    ? 'default'
                    : booking.status === 'CANCELLED'
                      ? 'destructive'
                      : booking.status === 'IN_PROGRESS'
                        ? 'secondary'
                        : 'outline'
                }
                className="text-sm px-3 py-1"
              >
                {booking.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <BookingTimeline status={booking.status} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Service
                  </h2>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {booking.service.images?.[0] ? (
                        <ImageWithFallback
                          src={booking.service.images[0]}
                          alt={booking.service.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {booking.service.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {booking.service.category.name}
                      </p>
                      <p className="text-xl font-bold text-chazon-primary mt-2">
                        UGX {booking.service.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {booking.scheduledTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 lg:col-span-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{booking.address}</span>
                    </div>
                  </div>
                  {booking.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Notes:</p>
                      <p className="text-sm text-gray-700">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Steward Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {isClient ? 'Your Steward' : 'Client'}
                </h2>
                <div className="flex items-center gap-4">
                  <UserAvatar
                    image={
                      isClient
                        ? booking.service.steward.image
                        : (booking as any).client?.image
                    }
                    name={
                      isClient
                        ? booking.service.steward.name
                        : (booking as any).client?.name
                    }
                    size="lg"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {isClient
                        ? booking.service.steward.name
                        : (booking as any).client?.name}
                    </p>
                    {isClient && booking.service.steward.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">
                          {booking.service.steward.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({booking.service.steward.totalReviews || 0} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  {booking.status !== 'CANCELLED' &&
                    booking.status !== 'COMPLETED' && (
                      <Link href="/chat">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </Link>
                    )}
                </div>
              </div>

              {/* Reviews Section */}
              {user && booking && booking.status === 'COMPLETED' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Reviews
                  </h2>
                  {!userReview && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                      {(() => {
                        const revieweeId = isClient
                          ? (booking as any).stewardId
                          : (booking as any).clientId;
                        const revieweeName = isClient
                          ? booking.service.steward.name
                          : (booking as any).client?.name || 'Client';
                        return (
                          <ReviewForm
                            taskId={id}
                            revieweeId={revieweeId}
                            revieweeName={revieweeName}
                            onReviewSubmitted={async () => {
                              try {
                                const response = await fetch(
                                  `/api/reviews?taskId=${id}`
                                );
                                const data = await response.json();
                                if (data.success) {
                                  setReviews(data.data || []);
                                  const userRev = data.data?.find(
                                    (r: any) => r.reviewerId === user.id
                                  );
                                  setUserReview(userRev || null);
                                }
                              } catch (err) {
                                console.error(
                                  'Failed to refresh reviews:',
                                  err
                                );
                              }
                            }}
                          />
                        );
                      })()}
                    </div>
                  )}
                  {userReview && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Your Review
                      </h3>
                      <ReviewCard
                        review={{
                          reviewer: {
                            name: userReview.reviewer.name,
                            image: userReview.reviewer.image,
                          },
                          rating: userReview.rating,
                          comment: userReview.comment,
                          createdAt: userReview.createdAt,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions Card */}
              {getTaskActions() && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Actions
                  </h2>
                  {isUpdating ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-3">{getTaskActions()}</div>
                  )}
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Quick Links
                </h2>
                <div className="space-y-2">
                  <Link
                    href="/bookings"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      All Bookings
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                  <Link
                    href={`/service/${booking.service.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      View Service
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                  <Link
                    href="/help"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      Help Center
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Add a Tip (Optional)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Show your appreciation. Tips go 100% to the steward.
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
                onChange={e => setTipAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTipModal(false);
                  setTipAmount('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmWithTip}
                disabled={isUpdating}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
