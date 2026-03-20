'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Menu,
  X,
  User,
  MessageSquare,
  ChevronDown,
  LayoutDashboard,
  Settings,
  CreditCard,
  Calendar,
  FileText,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subscribeToUnreadCount } from '@/lib/supabase/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { NotificationsDropdown } from '@/components/ui/notifications-dropdown';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth';

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCount();

      let channel: RealtimeChannel | null = null;

      try {
        channel = subscribeToUnreadCount(
          user.id,
          count => {
            setUnreadCount(count);
          },
          () => {
            const interval = setInterval(fetchUnreadCount, 10000);
            return () => clearInterval(interval);
          }
        );
      } catch (error) {
        console.error('Realtime subscription error:', error);
        const interval = setInterval(fetchUnreadCount, 10000);
        return () => clearInterval(interval);
      }

      return () => {
        if (channel) channel.unsubscribe();
      };
    }
  }, [isAuthenticated, user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/chat/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100'
          : 'bg-white border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-chazon-primary to-chazon-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-chazon-primary/25 group-hover:shadow-xl group-hover:shadow-chazon-primary/30 transition-all">
              <span className="text-white font-bold text-lg">CH</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Chazon</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-10">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-chazon-primary" />
                <Input
                  type="text"
                  placeholder="Search for services..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-12 bg-gray-50 border-transparent rounded-full focus:bg-white focus:border-chazon-primary/30 focus:ring-2 focus:ring-chazon-primary/20 transition-all"
                />
              </div>
            </form>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-2">
            <Link
              href="/services"
              className="px-4 py-2.5 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all font-medium"
            >
              Services
            </Link>
            {user?.role !== 'STEWARD' && user?.role !== 'ADMIN' && (
              <Link
                href="/become-steward"
                className="px-4 py-2.5 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all font-medium"
              >
                Become a Steward
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-4 py-2.5 text-chazon-primary bg-chazon-primary/10 hover:bg-chazon-primary/20 rounded-xl transition-all font-semibold"
              >
                Admin
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <NotificationsDropdown />

                <Link href="/chat" className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-2 px-2 h-12 rounded-xl hover:bg-gray-50"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-white shadow">
                        <AvatarImage
                          src={user?.image || ''}
                          alt={user?.name || ''}
                        />
                        <AvatarFallback className="bg-chazon-primary/10 text-chazon-primary font-semibold">
                          {user?.name?.charAt(0) || (
                            <User className="w-4 h-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-72 p-2"
                    align="end"
                    forceMount
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-2">
                      <Avatar className="h-12 w-12 ring-2 ring-white shadow">
                        <AvatarImage
                          src={user?.image || ''}
                          alt={user?.name || ''}
                        />
                        <AvatarFallback className="bg-chazon-primary text-white font-semibold text-lg">
                          {user?.name?.charAt(0) || (
                            <User className="w-5 h-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-semibold text-gray-900">
                          {user?.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user?.email}
                        </p>
                        <Badge
                          variant="secondary"
                          className="w-fit mt-1 text-xs"
                        >
                          {user?.role === 'STEWARD'
                            ? 'Steward'
                            : user?.role === 'ADMIN'
                              ? 'Admin'
                              : 'Client'}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 py-2.5"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-500" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link
                        href="/bookings"
                        className="flex items-center gap-3 py-2.5"
                      >
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>My Bookings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link
                        href="/chat"
                        className="flex items-center gap-3 py-2.5"
                      >
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span>Messages</span>
                        {unreadCount > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white">
                            {unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 py-2.5"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === 'STEWARD' && (
                      <>
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem asChild className="rounded-lg">
                          <Link
                            href="/dashboard/wallet"
                            className="flex items-center gap-3 py-2.5"
                          >
                            <CreditCard className="w-4 h-4 text-gray-500" />
                            <span>Wallet & Earnings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-lg">
                          <Link
                            href="/dashboard/services"
                            className="flex items-center gap-3 py-2.5"
                          >
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span>My Services</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {user?.role === 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem asChild className="rounded-lg">
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 py-2.5"
                          >
                            <Shield className="w-4 h-4 text-chazon-primary" />
                            <span className="font-semibold">Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem
                      className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      onSelect={async event => {
                        event.preventDefault();
                        await logout();
                        router.push('/auth/signin');
                        router.refresh();
                      }}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/auth/signin')}
                  className="font-medium"
                >
                  Log in
                </Button>
                <Button
                  onClick={() => router.push('/auth/signup')}
                  className="font-medium shadow-lg shadow-chazon-primary/25"
                >
                  Sign up
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-gray-50 border-transparent rounded-full"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMenuOpen ? 'max-h-screen' : 'max-h-0'
        }`}
      >
        <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-1">
          <Link
            href="/services"
            className="flex items-center px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
            onClick={() => setIsMenuOpen(false)}
          >
            Services
          </Link>
          {isAuthenticated && (
            <Link
              href="/chat"
              className="flex items-center justify-between px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                Messages
              </span>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
              )}
            </Link>
          )}
          {isAuthenticated &&
            user?.role !== 'STEWARD' &&
            user?.role !== 'ADMIN' && (
              <Link
                href="/become-steward"
                className="flex items-center px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Become a Steward
              </Link>
            )}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <>
              <Link
                href="/admin"
                className="flex items-center px-4 py-3 text-chazon-primary font-semibold hover:bg-chazon-primary/5 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                User Management
              </Link>
              <Link
                href="/admin/tasks"
                className="flex items-center px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Task Monitoring
              </Link>
              <Link
                href="/admin/disputes"
                className="flex items-center px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Disputes
              </Link>
              <Link
                href="/admin/payouts"
                className="flex items-center px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Payouts
              </Link>
              <Link
                href="/admin/stewards"
                className="flex items-center px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Steward Applications
              </Link>
            </>
          )}
          {isAuthenticated ? (
            <>
              <div className="h-px bg-gray-100 my-3" />
              <Link
                href="/dashboard"
                className="flex items-center px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/bookings"
                className="flex items-center px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                My Bookings
              </Link>
              <Link
                href="/settings"
                className="flex items-center px-4 py-3 text-gray-700 hover:text-chazon-primary hover:bg-gray-50 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={async () => {
                  setIsMenuOpen(false);
                  await logout();
                  router.push('/auth/signin');
                  router.refresh();
                }}
                className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="h-px bg-gray-100 my-3" />
          )}
          {!isAuthenticated && (
            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  router.push('/auth/signin');
                  setIsMenuOpen(false);
                }}
                className="w-full"
              >
                Log in
              </Button>
              <Button
                onClick={() => {
                  router.push('/auth/signup');
                  setIsMenuOpen(false);
                }}
                className="w-full shadow-lg"
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
