'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock3,
  User,
  Settings,
  BookOpen,
  Star,
  Wallet,
  TrendingUp,
  Plus,
  ArrowRight,
  CalendarCheck,
  MessageSquare,
  Award,
  Briefcase,
  Clock,
  RefreshCw,
  Lightbulb,
  CalendarDays,
  Sparkles,
  ChevronRight,
  Eye,
  Heart,
  Send,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useBookingsStore } from '@/store/bookings';
import { TermsBanner } from '@/components/ui/terms-banner';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { StatCardSkeleton } from '@/components/ui/skeleton';

function getStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <CheckCircle className="h-3.5 w-3.5" />
          Confirmed
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <CheckCircle className="h-3.5 w-3.5" />
          Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          <XCircle className="h-3.5 w-3.5" />
          Cancelled
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          <Clock3 className="h-3.5 w-3.5" />
          Pending
        </span>
      );
  }
}

interface SkillRecommendation {
  category: string;
  demand: number;
  unassignedTasks: number;
  averagePrice: number;
  score: number;
  reason: string;
}

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { bookings } = useBookingsStore();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletCurrency, setWalletCurrency] = useState<string>('UGX');
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [skillRecommendations, setSkillRecommendations] = useState<
    SkillRecommendation[]
  >([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    servicesViewed: 0,
  });

  const isSteward = user?.role === 'STEWARD';

  useEffect(() => {
    if (!isAuthenticated || !user) {
      redirect('/auth/signin');
    }

    if (user.role === 'ADMIN') {
      redirect('/admin');
    }

    if (isAuthenticated) {
      fetchWalletBalance();
      fetchStats();
      if (isSteward) {
        fetchSkillRecommendations();
      }
    }
  }, [isAuthenticated, user]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        const allBookings = data.data || [];
        const active = allBookings.filter(
          (b: any) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS'
        ).length;
        const completed = allBookings.filter(
          (b: any) => b.status === 'COMPLETED'
        ).length;
        const spent = allBookings
          .filter((b: any) => b.isPaid)
          .reduce((sum: number, b: any) => sum + (b.service?.price || 0), 0);

        setStats({
          activeBookings: active,
          completedBookings: completed,
          totalSpent: spent,
          servicesViewed: Math.floor(Math.random() * 50) + 10,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSkillRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const response = await fetch('/api/steward/recommendations/skills');
      if (response.ok) {
        const data = await response.json();
        setSkillRecommendations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching skill recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      setLoadingWallet(true);
      const response = await fetch('/api/wallet/balance');
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance?.availableBalance || 0);
        setWalletCurrency(data.balance?.currency || 'UGX');
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setLoadingWallet(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'UGX') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const recentBookings = bookings.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <TermsBanner />
      <Header />
      <main className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Welcome back, {user.name?.split(' ')[0]} 👋
              </h1>
              <p className="mt-1 text-gray-500">
                {isSteward
                  ? "Here's what's happening with your services today."
                  : "Here's an overview of your bookings and activity."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isSteward && (
                <Link
                  href="/dashboard/services/create"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-chazon-primary text-white rounded-xl hover:bg-chazon-primary-dark transition-all shadow-lg shadow-chazon-primary/25 hover:shadow-xl hover:shadow-chazon-primary/30"
                >
                  <Plus className="h-4 w-4" />
                  Add Service
                </Link>
              )}
              <button
                onClick={() => window.location.reload()}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {/* Profile Card */}
            <div className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {isSteward ? 'Steward' : 'Client'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">Account</p>
              <p className="text-xl font-bold text-gray-900 line-clamp-1">
                {user.name}
              </p>
              {user.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {user.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Active Bookings */}
            <Link href="/bookings">
              <div className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
                    <CalendarCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-sm text-gray-500 mb-1">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeBookings}
                </p>
                <p className="text-xs text-gray-400 mt-1">bookings</p>
              </div>
            </Link>

            {/* Completed */}
            <Link href="/bookings?filter=COMPLETED">
              <div className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedBookings}
                </p>
                <p className="text-xs text-gray-400 mt-1">bookings</p>
              </div>
            </Link>

            {/* Total Spent / Wallet */}
            {isSteward ? (
              <Link href="/dashboard/wallet">
                <div className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors">
                      <Wallet className="h-5 w-5 text-green-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Wallet</p>
                  <p className="text-xl font-bold text-gray-900">
                    {loadingWallet
                      ? '...'
                      : walletBalance !== null
                        ? formatCurrency(walletBalance, walletCurrency)
                        : 'UGX 0'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">available</p>
                </div>
              </Link>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-green-50">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">Total Spent</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.totalSpent)}
                </p>
                <p className="text-xs text-gray-400 mt-1">all time</p>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Bookings - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Recent Bookings
                  </h2>
                  <p className="text-sm text-gray-500">
                    Your latest service activity
                  </p>
                </div>
                <Link
                  href="/bookings"
                  className="inline-flex items-center gap-1 text-sm font-medium text-chazon-primary hover:text-chazon-primary-dark transition-colors"
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking: any) => (
                    <Link
                      key={booking.id}
                      href={`/booking/confirmation/${booking.id}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="relative h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {booking.service?.images?.[0] ? (
                          <Image
                            src={booking.service.images[0]}
                            alt={booking.service.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {booking.service?.title || 'Service'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.scheduledDate).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric' }
                          )}{' '}
                          • {booking.scheduledTime}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(booking.status)}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">
                      No bookings yet. Find your perfect service.
                    </p>
                    <Link
                      href="/services"
                      className="inline-flex items-center gap-2 text-sm font-medium text-chazon-primary hover:text-chazon-primary-dark"
                    >
                      Browse Services
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Quick Actions & More */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/services"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Browse Services
                    </span>
                  </Link>
                  {isSteward ? (
                    <>
                      <Link
                        href="/dashboard/services"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                          <Briefcase className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          My Services
                        </span>
                      </Link>
                      <Link
                        href="/dashboard/wallet"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                          <Wallet className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Wallet & Earnings
                        </span>
                      </Link>
                      <Link
                        href="/dashboard/availability"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
                          <CalendarDays className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Manage Availability
                        </span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/become-steward"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-chazon-primary/10 group-hover:bg-chazon-primary/20 transition-colors">
                        <Award className="h-4 w-4 text-chazon-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Become a Steward
                      </span>
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                      <Settings className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Settings
                    </span>
                  </Link>
                </div>
              </div>

              {/* Become Steward CTA (for clients) or Service Stats (for stewards) */}
              {!isSteward ? (
                <div className="bg-gradient-to-br from-chazon-primary to-chazon-primary-dark rounded-2xl p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white/20">
                      <Award className="h-6 w-6" />
                    </div>
                    <Sparkles className="h-5 w-5 text-white/60" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    Earn with your skills
                  </h3>
                  <p className="text-sm text-white/80 mb-4">
                    Join our network of trusted service professionals and grow
                    your business.
                  </p>
                  <Link
                    href="/become-steward"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-chazon-primary rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
                  >
                    Apply Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-900 mb-4">
                    Your Performance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Response Rate</span>
                        <span className="font-medium text-gray-900">98%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-[98%] bg-green-500 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Completion Rate</span>
                        <span className="font-medium text-gray-900">95%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-[95%] bg-blue-500 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">5-Star Reviews</span>
                        <span className="font-medium text-gray-900">87%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-[87%] bg-yellow-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/analytics"
                    className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-chazon-primary hover:text-chazon-primary-dark transition-colors"
                  >
                    View Detailed Analytics
                    <TrendingUp className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Skill Recommendations (Stewards Only) */}
          {isSteward && skillRecommendations.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-50">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Skill Recommendations
                    </h2>
                    <p className="text-sm text-gray-500">
                      Opportunities based on market demand
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {skillRecommendations.slice(0, 3).map(rec => (
                  <div
                    key={rec.category}
                    className="p-4 rounded-xl border border-gray-100 hover:border-chazon-primary/30 hover:bg-chazon-primary/5 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {rec.category}
                      </h3>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {rec.reason}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Avg: {formatCurrency(rec.averagePrice)}</span>
                      <span>{rec.demand} tasks/mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Need Help?</h3>
                <p className="text-sm text-gray-500">
                  Check out our help center or contact support for assistance.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/help"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Help Center
                </Link>
                <Link
                  href="/contact"
                  className="px-4 py-2 text-sm font-medium text-white bg-chazon-primary rounded-lg hover:bg-chazon-primary-dark transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
