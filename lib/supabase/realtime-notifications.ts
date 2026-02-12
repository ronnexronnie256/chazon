/**
 * Supabase Realtime utilities for notifications
 */

import { createClient } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: any
  readAt: string | null
  createdAt: string
}

/**
 * Subscribe to new notifications for a user
 * Note: This requires the userId to be passed since we can't reliably get it from session in this context
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const supabase = createClient()
  
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'Notification',
        filter: `userId=eq.${userId}`,
      },
      async (payload) => {
        try {
          // Transform payload to Notification interface
          const notification: Notification = {
            id: payload.new.id as string,
            userId: payload.new.userId as string,
            type: payload.new.type as string,
            title: payload.new.title as string,
            message: payload.new.message as string,
            data: payload.new.data as any,
            readAt: payload.new.readAt as string | null,
            createdAt: payload.new.createdAt as string,
          }

          onNotification(notification)
        } catch (error) {
          console.error('Error processing new notification:', error)
          onError?.(error as Error)
        }
      }
    )
    .subscribe()

  return channel
}

