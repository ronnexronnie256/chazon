'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { redirect } from 'next/navigation'
import { Bell, CheckCheck, Trash2, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  readAt: string | null
  createdAt: string
  data?: any
}

export default function NotificationsPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      redirect('/auth/signin')
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications()
    }
  }, [isAuthenticated, user, filter, page])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append('limit', '20')
      params.append('page', page.toString())
      if (filter === 'unread') {
        params.append('unreadOnly', 'true')
      }

      const response = await fetch(`/api/notifications?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.data || [])
        setUnreadCount(data.meta?.unreadCount || 0)
        setTotalPages(data.meta?.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
        )
        setUnreadCount(0)
        toast.success('All notifications marked as read')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        const notification = notifications.find((n) => n.id === notificationId)
        if (notification && !notification.readAt) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
        toast.success('Notification deleted')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_ACCEPTED':
      case 'TASK_STARTED':
      case 'TASK_COMPLETED':
      case 'TASK_CONFIRMED':
        return '📋'
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_RELEASED':
      case 'WITHDRAWAL_COMPLETED':
        return '💰'
      case 'WITHDRAWAL_FAILED':
        return '⚠️'
      case 'REVIEW_RECEIVED':
        return '⭐'
      case 'DISPUTE_OPENED':
      case 'DISPUTE_RESOLVED':
        return '⚖️'
      case 'BROADCAST_TASK':
        return '📢'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    if (type.includes('PAYMENT') || type.includes('WITHDRAWAL')) return 'bg-green-100 text-green-800'
    if (type.includes('FAILED') || type.includes('DISPUTE')) return 'bg-red-100 text-red-800'
    if (type.includes('TASK')) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilter('all')
                  setPage(1)
                }}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilter('unread')
                  setPage(1)
                }}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`p-4 hover:shadow-md transition-shadow ${
                      !notification.readAt ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <Badge className={getNotificationColor(notification.type)}>
                                {notification.type.replace(/_/g, ' ')}
                              </Badge>
                              {!notification.readAt && (
                                <Badge variant="default" className="bg-blue-500">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.readAt && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                title="Mark as read"
                              >
                                <CheckCheck className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

