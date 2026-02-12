/**
 * Supabase Realtime utilities for chat
 */

import { createClient } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  taskId: string
  senderId: string
  content: string
  contentType: string
  readAt: string | null
  createdAt: string
  sender: {
    id: string
    name: string
    image?: string
    role: string
  }
}

/**
 * Subscribe to new messages for a specific task
 */
export function subscribeToTaskMessages(
  taskId: string,
  onMessage: (message: ChatMessage) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const supabase = createClient()
  
  const channel = supabase
    .channel(`task:${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ChatMessage', // Table name - if this doesn't work, check actual table name in Supabase (might be lowercase: 'chatmessage')
        filter: `taskId=eq.${taskId}`,
      },
      async (payload) => {
        try {
          // Fetch the full message with sender info from our API
          // This ensures we get the proper Prisma relations
          const response = await fetch(`/api/chat/${taskId}`)
          if (response.ok) {
            const data = await response.json()
            const messages = data.data || []
            // Find the new message (it should be the last one)
            const newMessage = messages.find((msg: ChatMessage) => msg.id === payload.new.id)
            if (newMessage) {
              onMessage(newMessage)
            }
          } else {
            // Fallback: construct message from payload
            const chatMessage: ChatMessage = {
              id: payload.new.id as string,
              taskId: payload.new.taskId as string,
              senderId: payload.new.senderId as string,
              content: payload.new.content as string,
              contentType: payload.new.contentType as string,
              readAt: payload.new.readAt as string | null,
              createdAt: payload.new.createdAt as string,
              sender: {
                id: payload.new.senderId as string,
                name: 'User', // Will be updated on next fetch
                role: 'CLIENT',
              },
            }
            onMessage(chatMessage)
          }
        } catch (error) {
          console.error('Error processing new message:', error)
          onError?.(error as Error)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to unread message count changes for a user
 */
export function subscribeToUnreadCount(
  userId: string,
  onUpdate: (count: number) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const supabase = createClient()
  
  // Subscribe to all messages where the user is not the sender
  const channel = supabase
    .channel(`unread:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ChatMessage', // Table name - if this doesn't work, check actual table name in Supabase (might be lowercase: 'chatmessage')
        filter: `senderId=neq.${userId}`,
      },
      async () => {
        try {
          // Fetch updated unread count
          const response = await fetch('/api/chat/unread')
          if (response.ok) {
            const data = await response.json()
            onUpdate(data.unreadCount || 0)
          }
        } catch (error) {
          console.error('Error fetching unread count:', error)
          onError?.(error as Error)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to conversation updates (latest message changes)
 */
export function subscribeToConversations(
  userId: string,
  onUpdate: () => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const supabase = createClient()
  
  // Subscribe to all messages for tasks where user is client or steward
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ChatMessage', // Table name - if this doesn't work, check actual table name in Supabase (might be lowercase: 'chatmessage')
      },
      async () => {
        try {
          // Trigger conversation list refresh
          onUpdate()
        } catch (error) {
          console.error('Error updating conversations:', error)
          onError?.(error as Error)
        }
      }
    )
    .subscribe()

  return channel
}

