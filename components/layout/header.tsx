'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Menu, X, User, Bell, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { subscribeToUnreadCount } from '@/lib/supabase/realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { NotificationsDropdown } from '@/components/ui/notifications-dropdown'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Fetch unread message count and set up Realtime subscription
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial fetch
      fetchUnreadCount()

      // Set up Realtime subscription for unread count updates
      let channel: RealtimeChannel | null = null

      try {
        channel = subscribeToUnreadCount(
          user.id,
          (count) => {
            setUnreadCount(count)
          },
          (error) => {
            console.error('Realtime subscription error:', error)
            // Fallback to polling if Realtime fails
            const interval = setInterval(fetchUnreadCount, 10000)
            return () => clearInterval(interval)
          }
        )
      } catch (error) {
        console.error('Error setting up Realtime subscription:', error)
        // Fallback to polling if Realtime setup fails
        const interval = setInterval(fetchUnreadCount, 10000)
        return () => clearInterval(interval)
      }

      // Cleanup subscription on unmount
      return () => {
        if (channel) {
          channel.unsubscribe()
        }
      }
    }
  }, [isAuthenticated, user])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/chat/unread')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-chazon-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CH</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Chazon</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="What do you need help with?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-chazon-primary focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/services"
              className="text-gray-700 hover:text-chazon-primary transition-colors"
            >
              Services
            </Link>
            {user?.role !== 'STEWARD' && user?.role !== 'ADMIN' && (
              <Link
                href="/become-steward"
                className="text-gray-700 hover:text-chazon-primary transition-colors"
              >
                Become a Steward
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-gray-700 hover:text-chazon-primary transition-colors font-medium"
              >
                Admin
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <NotificationsDropdown />

                {/* Messages */}
                <Link href="/chat">
                  <Button variant="ghost" size="sm" className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 flex items-center justify-center bg-chazon-primary text-white text-xs">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                        <AvatarFallback>
                          {user?.name?.charAt(0) || <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {user?.name && (
                          <p className="font-medium">{user.name}</p>
                        )}
                        {user?.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookings">My Bookings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    {user?.role === 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/users">User Management</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/tasks">Task Monitoring</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/disputes">Disputes</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/payouts">Payouts</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/stewards">Steward Applications</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={async (event) => {
                        event.preventDefault()
                        await logout()
                        router.push('/')
                        router.refresh()
                      }}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={() => router.push('/auth/signin')}>
                  Log in
                </Button>
                <Button onClick={() => router.push('/auth/signup')} className="bg-chazon-primary hover:bg-chazon-primary-dark">
                  Sign up
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="What do you need help with?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            <Link
              href="/services"
              className="block px-3 py-2 text-gray-700 hover:text-chazon-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            {isAuthenticated && (
              <Link
                href="/chat"
                className="flex items-center justify-between px-3 py-2 text-gray-700 hover:text-chazon-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </span>
                {unreadCount > 0 && (
                  <Badge className="bg-chazon-primary text-white text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Link>
            )}
            {isAuthenticated && user?.role !== 'STEWARD' && user?.role !== 'ADMIN' && (
              <Link
                href="/become-steward"
                className="block px-3 py-2 text-gray-700 hover:text-chazon-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Become a Steward
              </Link>
            )}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <>
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-gray-700 hover:text-chazon-primary font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="block px-3 py-2 text-gray-700 hover:text-chazon-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  User Management
                </Link>
                <Link
                  href="/admin/tasks"
                  className="block px-3 py-2 text-gray-700 hover:text-chazon-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Task Monitoring
                </Link>
                <Link
                  href="/admin/disputes"
                  className="block px-3 py-2 text-gray-700 hover:text-chazon-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Disputes
                </Link>
                <Link
                  href="/admin/payouts"
                  className="block px-3 py-2 text-gray-700 hover:text-chazon-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Payouts
                </Link>
                <Link
                  href="/admin/stewards"
                  className="block px-3 py-2 text-gray-700 hover:text-chazon-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Steward Applications
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-gray-700 hover:text-chazon-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-gray-700 hover:text-chazon-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={async () => {
                    setIsMenuOpen(false)
                    await logout()
                    router.push('/')
                    router.refresh()
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-chazon-primary"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    router.push('/auth/signin')
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-chazon-primary"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    router.push('/auth/signup')
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-white bg-chazon-primary rounded-md"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
