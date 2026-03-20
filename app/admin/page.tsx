'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
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
  BarChart3,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  UserPlus,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  StatCard,
  QuickActionCard,
  ActivityCard,
  ChartCard,
} from '@/components/ui/stat-card';
import { CountBadge } from '@/components/ui/badge';

interface DashboardMetrics {
  totalUsers: number;
  totalStewards: number;
  totalClients: number;
  totalTasks: number;
  pendingTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalRevenue: number;
  platformFees: number;
  pendingDisputes: number;
  pendingApplications: number;
  newUsersToday: number;
  revenueToday: number;
}

interface TimeSeriesData {
  date: string;
  users: number;
  tasks: number;
  revenue: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsData {
  timeSeries: TimeSeriesData[];
  summary: {
    totalUsers: number;
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    totalRevenue: number;
    userGrowthRate: number;
    taskGrowthRate: number;
    revenueGrowthRate: number;
  };
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      return;
    }
    fetchMetrics();
    fetchAnalytics();
  }, [isAuthenticated, user, refreshKey]);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/metrics');
      const data = await response.json();
      if (response.ok) {
        setMetrics({
          ...data.data,
          newUsersToday: Math.floor(Math.random() * 10), // Placeholder
          revenueToday: Math.floor(Math.random() * 500000), // Placeholder
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true);
      const response = await fetch(
        `/api/admin/analytics?period=${analyticsPeriod}`
      );
      const data = await response.json();
      if (response.ok) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    toast.success('Dashboard refreshed');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (analyticsPeriod === '7') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const COLORS = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#3b82f6',
  ];

  const categoryData = [
    { name: 'Cleaning', value: 35 },
    { name: 'Handyman', value: 28 },
    { name: 'Plumbing', value: 22 },
    { name: 'Electrical', value: 15 },
  ];

  const recentActivity = [
    {
      id: '1',
      icon: UserPlus,
      iconColor: 'bg-green-100 text-green-600',
      content: 'Sarah Namuli registered as new user',
      time: '2 min ago',
    },
    {
      id: '2',
      icon: CheckCircle,
      iconColor: 'bg-blue-100 text-blue-600',
      content: 'Booking #1234 completed successfully',
      time: '5 min ago',
    },
    {
      id: '3',
      icon: AlertTriangle,
      iconColor: 'bg-red-100 text-red-600',
      content: 'Dispute filed for Booking #1230',
      time: '10 min ago',
    },
    {
      id: '4',
      icon: UserCheck,
      iconColor: 'bg-purple-100 text-purple-600',
      content: 'John Kato approved as Steward',
      time: '15 min ago',
    },
    {
      id: '5',
      icon: DollarSign,
      iconColor: 'bg-green-100 text-green-600',
      content: 'Payout of UGX 250,000 processed',
      time: '30 min ago',
    },
  ];

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chazon-primary mx-auto"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: metrics?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      bgColor: 'from-blue-500 to-blue-600',
      link: '/admin/users',
      trend: 12,
      badge: metrics?.newUsersToday,
      badgeColor: 'bg-green-500',
    },
    {
      title: 'Active Stewards',
      value: metrics?.totalStewards || 0,
      icon: UserCheck,
      color: 'green',
      bgColor: 'from-green-500 to-green-600',
      link: '/admin/stewards',
      trend: 8,
      badge: metrics?.pendingApplications,
      badgeColor: 'bg-yellow-500',
    },
    {
      title: 'Total Tasks',
      value: metrics?.totalTasks || 0,
      icon: Briefcase,
      color: 'purple',
      bgColor: 'from-purple-500 to-purple-600',
      link: '/admin/tasks',
      trend: 15,
    },
    {
      title: 'Completed',
      value: metrics?.completedTasks || 0,
      icon: CheckCircle,
      color: 'emerald',
      bgColor: 'from-emerald-500 to-emerald-600',
      subtitle: `${Math.round(((metrics?.completedTasks || 0) / Math.max(metrics?.totalTasks || 1, 1)) * 100)}% rate`,
    },
    {
      title: 'Pending Disputes',
      value: metrics?.pendingDisputes || 0,
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'from-red-500 to-red-600',
      link: '/admin/disputes',
      badge: metrics?.pendingDisputes,
      badgeColor: 'bg-red-500',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics?.totalRevenue || 0),
      icon: DollarSign,
      color: 'indigo',
      bgColor: 'from-indigo-500 to-indigo-600',
      link: '/admin/payouts',
      trend: 23,
    },
  ];

  const quickActions = [
    {
      title: 'Review Applications',
      description: `${metrics?.pendingApplications || 0} pending applications`,
      icon: UserCheck,
      color: 'green',
      href: '/admin/stewards',
      badge: metrics?.pendingApplications,
    },
    {
      title: 'Resolve Disputes',
      description: `${metrics?.pendingDisputes || 0} open disputes`,
      icon: AlertTriangle,
      color: 'red',
      href: '/admin/disputes',
      badge: metrics?.pendingDisputes,
    },
    {
      title: 'Add New User',
      description: 'Create user account manually',
      icon: Plus,
      color: 'blue',
      href: '/admin/users',
    },
    {
      title: 'Export Reports',
      description: 'Download platform data',
      icon: Download,
      color: 'purple',
      href: '/admin',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here&apos;s what&apos;s happening on Chazon.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw
              className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
          <select
            value={analyticsPeriod}
            onChange={e => {
              setAnalyticsPeriod(e.target.value);
              fetchAnalytics();
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chazon-primary"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
            {statCards.map(card => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2">
              <ChartCard
                title="Revenue Trend"
                subtitle="Platform revenue over time"
                actions={
                  <div className="flex gap-2">
                    {['7d', '30d', '90d'].map(period => (
                      <button
                        key={period}
                        onClick={() =>
                          setAnalyticsPeriod(
                            period === '7d'
                              ? '7'
                              : period === '30d'
                                ? '30'
                                : '90'
                          )
                        }
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          analyticsPeriod ===
                          (period === '7d'
                            ? '7'
                            : period === '30d'
                              ? '30'
                              : '90')
                            ? 'bg-chazon-primary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                }
              >
                {analytics ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.timeSeries}>
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#6366f1"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#6366f1"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={v => `${(v / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        formatter={value =>
                          value !== undefined
                            ? formatCurrency(value as number)
                            : ''
                        }
                        labelFormatter={formatDate}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    No data available
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Category Distribution */}
            <div>
              <ChartCard
                title="Service Categories"
                subtitle="Distribution by type"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2">
              <ActivityCard
                title="Recent Activity"
                items={recentActivity}
                viewAllLink="/admin/activity"
              />
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map(action => (
                  <QuickActionCard key={action.title} {...action} />
                ))}
              </div>
            </div>
          </div>

          {/* Third Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <ChartCard title="User Growth" subtitle="New registrations">
              {analytics ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip labelFormatter={formatDate} />
                    <Bar
                      dataKey="users"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      name="New Users"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-400">
                  No data available
                </div>
              )}
            </ChartCard>

            {/* Task Completion */}
            <ChartCard title="Task Statistics" subtitle="Overview">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-medium">
                      {Math.round(
                        ((metrics?.completedTasks || 0) /
                          Math.max(metrics?.totalTasks || 1, 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round(((metrics?.completedTasks || 0) / Math.max(metrics?.totalTasks || 1, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-xl">
                    <div className="flex items-center gap-2 text-yellow-600 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.pendingTasks || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.activeTasks || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.completedTasks || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Disputes</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.pendingDisputes || 0}
                    </p>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
