'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  AlertTriangle,
  DollarSign,
  MessageSquare,
  Flag,
  Shield,
  LogOut,
  ChevronRight,
  Home,
  Menu,
  X,
  Bell,
  Search,
  Settings,
  TrendingUp,
  Clock,
  UserPlus,
  CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CountBadge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  badgeKey?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, number>>({
    disputes: 0,
    applications: 0,
    flagged: 0,
    users: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (user?.role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }

    fetchNotifications();
    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const navItems: NavItem[] = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
      badge: notifications.users,
    },
    { label: 'Tasks', href: '/admin/tasks', icon: Briefcase },
    {
      label: 'Stewards',
      href: '/admin/stewards',
      icon: Shield,
      badge: notifications.applications,
    },
    {
      label: 'Disputes',
      href: '/admin/disputes',
      icon: AlertTriangle,
      badge: notifications.disputes,
    },
    { label: 'Payouts', href: '/admin/payouts', icon: DollarSign },
    {
      label: 'Flagged Messages',
      href: '/admin/flagged-messages',
      icon: Flag,
      badge: notifications.flagged,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const recentActivity = [
    {
      icon: UserPlus,
      color: 'text-green-600',
      text: 'New user registered',
      time: '2 min ago',
    },
    {
      icon: CheckCircle,
      color: 'text-blue-600',
      text: 'Booking completed',
      time: '5 min ago',
    },
    {
      icon: AlertTriangle,
      color: 'text-red-600',
      text: 'New dispute filed',
      time: '10 min ago',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chazon-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">Chazon</span>
            <span className="text-xs bg-chazon-primary text-white px-2 py-0.5 rounded">
              Admin
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-600" />
            {(notifications.disputes > 0 || notifications.applications > 0) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || ''} />
            <AvatarFallback>{user?.name?.charAt(0) || 'A'}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-full bg-gray-900 text-white transition-all duration-300 z-50
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {!isSidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">Chazon</span>
              <span className="text-xs bg-chazon-primary px-2 py-0.5 rounded">
                Admin
              </span>
            </Link>
          )}
          {isSidebarCollapsed && (
            <span className="text-xl font-bold mx-auto">C</span>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex p-1 rounded hover:bg-gray-800"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? '' : 'rotate-180'}`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center px-4 py-3 rounded-xl transition-all duration-200
                  ${
                    active
                      ? 'bg-chazon-primary text-white shadow-lg shadow-chazon-primary/30'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`}
                />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <CountBadge count={item.badge} className="ml-2" />
                    )}
                  </>
                )}
                {isSidebarCollapsed &&
                  item.badge !== undefined &&
                  item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats */}
        {!isSidebarCollapsed && (
          <div className="px-4 py-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Quick Stats
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Revenue Today</span>
                <span className="text-green-400 font-medium">UGX 125K</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Active Jobs</span>
                <span className="text-blue-400 font-medium">23</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">New Users</span>
                <span className="text-purple-400 font-medium">+8</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          {!isSidebarCollapsed ? (
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>Back to App</span>
              </Link>
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image || ''} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link href="/dashboard">
                <Home className="h-5 w-5 text-gray-400 hover:text-white" />
              </Link>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || ''} />
                <AvatarFallback>{user?.name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
        min-h-screen transition-all duration-300 pt-16 lg:pt-0
        ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
      `}
      >
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 lg:top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link
                href="/"
                className="hover:text-chazon-primary flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Admin</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm w-48"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
                {(notifications.disputes > 0 ||
                  notifications.applications > 0) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Date */}
              <span className="hidden lg:inline text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  active ? 'text-chazon-primary' : 'text-gray-500'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px]">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
