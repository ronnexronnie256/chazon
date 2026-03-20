'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Clock3,
  CreditCard,
  Search,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useBookingsStore } from '@/store/bookings';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PaymentButton } from '@/components/payment-button';
import { Button } from '@/components/ui/button';
import type { Booking } from '@/types/booking';

type FilterTab = 'all' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const statusConfig = {
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-green-500',
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    icon: CheckCircle,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-blue-500',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-500',
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    icon: XCircle,
  },
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-500',
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
    icon: Clock3,
  },
};

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All Bookings' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function BookingCard({ booking, user }: { booking: Booking; user: any }) {
  const config =
    statusConfig[booking.status as keyof typeof statusConfig] ||
    statusConfig.PENDING;
  const StatusIcon = config.icon;

  const formattedDate = new Date(booking.scheduledDate).toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
  );

  return (
    <Link href={`/booking/confirmation/${booking.id}`}>
      <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-chazon-primary/20 transition-all duration-300 overflow-hidden">
        {/* Header with image and status */}
        <div className="relative h-40 overflow-hidden">
          {booking.service.images && booking.service.images.length > 0 ? (
            <ImageWithFallback
              src={booking.service.images[0]}
              alt={booking.service.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Calendar className="h-12 w-12 text-gray-300" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${config.bg} ${config.text}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {config.label}
            </span>
          </div>

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-sm text-gray-800 shadow-sm">
              {booking.service.category.name}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title and price */}
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-chazon-primary transition-colors line-clamp-1">
              {booking.service.title}
            </h3>
            <span className="text-lg font-bold text-chazon-primary whitespace-nowrap ml-2">
              UGX {booking.service.price.toLocaleString()}
            </span>
          </div>

          {/* Date, Time, Location */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span>{booking.scheduledTime}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">{booking.address}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-4" />

          {/* Steward and payment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={booking.service.steward.name || 'Steward'}
                image={booking.service.steward.image}
                size="sm"
                className="ring-2 ring-white shadow-sm"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {booking.service.steward.name}
                </p>
                {booking.service.steward.rating && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="text-yellow-500">★</span>
                    {booking.service.steward.rating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>

            {/* Payment status */}
            {booking.isPaid ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <CreditCard className="h-3 w-3" />
                Paid
              </span>
            ) : booking.status === 'PENDING' && user?.role === 'CLIENT' ? (
              <div onClick={e => e.preventDefault()}>
                <PaymentButton
                  taskId={booking.id}
                  amount={booking.service.price}
                  currency={booking.service.currency || 'UGX'}
                  className="text-xs px-3 py-1.5"
                />
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                <Clock3 className="h-3 w-3" />
                Awaiting
              </span>
            )}
          </div>
        </div>

        {/* Footer arrow */}
        <div className="px-5 pb-4 flex justify-end">
          <span className="inline-flex items-center text-xs font-medium text-gray-400 group-hover:text-chazon-primary transition-colors">
            View Details
            <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      {/* Illustration */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
          <Calendar className="h-16 w-16 text-gray-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">No bookings yet</h2>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        You haven&apos;t made any bookings yet. Browse our services and find the
        perfect steward for your needs.
      </p>
      <Link href="/services">
        <Button
          size="lg"
          className="bg-chazon-primary hover:bg-chazon-primary-dark"
        >
          <Search className="h-4 w-4 mr-2" />
          Browse Services
        </Button>
      </Link>
    </div>
  );
}

function FilterBar({
  activeFilter,
  onFilterChange,
  counts,
}: {
  activeFilter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
  counts: Record<FilterTab, number>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-8">
      <Filter className="h-4 w-4 text-gray-400 mr-2" />
      {filterTabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onFilterChange(tab.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeFilter === tab.key
              ? 'bg-chazon-primary text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-chazon-primary hover:text-chazon-primary'
          }`}
        >
          {tab.label}
          <span
            className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              activeFilter === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {counts[tab.key]}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function BookingsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { bookings, isLoading, error, fetchBookings } = useBookingsStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, fetchBookings]);

  // Calculate counts for filter tabs
  const counts: Record<FilterTab, number> = {
    all: bookings.length,
    PENDING: bookings.filter(b => b.status === 'PENDING').length,
    CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
    COMPLETED: bookings.filter(b => b.status === 'COMPLETED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  // Filter bookings
  const filteredBookings =
    activeFilter === 'all'
      ? bookings
      : bookings.filter(b => b.status === activeFilter);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              My Bookings
            </h1>
            <p className="text-lg text-gray-500">
              View and manage all your service bookings
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => fetchBookings()}>Try Again</Button>
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Filter Bar */}
              <FilterBar
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                counts={counts}
              />

              {/* Results info */}
              <div className="mb-6 text-sm text-gray-500">
                Showing {filteredBookings.length} of {bookings.length} booking
                {bookings.length !== 1 ? 's' : ''}
              </div>

              {/* Booking Cards Grid */}
              {filteredBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredBookings.map(booking => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      user={user}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Filter className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No bookings found
                  </h3>
                  <p className="text-gray-500">
                    No bookings match the selected filter. Try a different
                    category.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
