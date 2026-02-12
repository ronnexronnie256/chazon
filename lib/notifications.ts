/**
 * Notification helper functions
 * Used to create notifications for various events
 */

import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export interface NotificationData {
  taskId?: string
  transactionId?: string
  disputeId?: string
  reviewId?: string
  amount?: number
  [key: string]: any
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
      },
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    // Don't throw - notifications are non-critical
    return null
  }
}

/**
 * Create notifications for task events
 */
export async function notifyTaskAssigned(taskId: string, stewardId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { client: true },
  })

  if (!task) return

  await createNotification(
    stewardId,
    'TASK_ASSIGNED',
    'New Task Assigned',
    `You have been assigned a new ${task.category} task from ${task.client.name}`,
    { taskId, amount: task.agreedPrice }
  )
}

export async function notifyTaskAccepted(taskId: string, clientId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { steward: true },
  })

  if (!task || !task.steward) return

  await createNotification(
    clientId,
    'TASK_ACCEPTED',
    'Task Accepted',
    `${task.steward.name} has accepted your ${task.category} task`,
    { taskId }
  )
}

export async function notifyTaskStarted(taskId: string, clientId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { steward: true },
  })

  if (!task || !task.steward) return

  await createNotification(
    clientId,
    'TASK_STARTED',
    'Task Started',
    `${task.steward.name} has started working on your ${task.category} task`,
    { taskId }
  )
}

export async function notifyTaskCompleted(taskId: string, clientId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { steward: true },
  })

  if (!task || !task.steward) return

  await createNotification(
    clientId,
    'TASK_COMPLETED',
    'Task Completed',
    `${task.steward.name} has completed your ${task.category} task. Please confirm completion to release payment.`,
    { taskId }
  )
}

export async function notifyTaskConfirmed(taskId: string, stewardId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { client: true },
  })

  if (!task) return

  await createNotification(
    stewardId,
    'TASK_CONFIRMED',
    'Task Confirmed',
    `${task.client.name} has confirmed completion of your ${task.category} task. Payment has been released.`,
    { taskId, amount: task.agreedPrice }
  )
}

export async function notifyTaskCancelled(taskId: string, userId: string, otherUserId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  })

  if (!task) return

  await createNotification(
    otherUserId,
    'TASK_CANCELLED',
    'Task Cancelled',
    `Your ${task.category} task has been cancelled`,
    { taskId }
  )
}

export async function notifyTaskExpired(taskId: string, clientId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  })

  if (!task) return

  await createNotification(
    clientId,
    'TASK_EXPIRED',
    'Task Expired',
    `Your ${task.category} task has expired and has been automatically refunded`,
    { taskId }
  )
}

/**
 * Create notifications for payment events
 */
export async function notifyPaymentReceived(userId: string, amount: number, taskId?: string) {
  await createNotification(
    userId,
    'PAYMENT_RECEIVED',
    'Payment Received',
    `Payment of ${amount.toLocaleString()} UGX has been received and is being held in escrow`,
    { taskId, amount }
  )
}

export async function notifyPaymentReleased(userId: string, amount: number, taskId: string) {
  await createNotification(
    userId,
    'PAYMENT_RELEASED',
    'Payment Released',
    `Payment of ${amount.toLocaleString()} UGX has been released to your wallet`,
    { taskId, amount }
  )
}

export async function notifyWithdrawalCompleted(userId: string, amount: number) {
  await createNotification(
    userId,
    'WITHDRAWAL_COMPLETED',
    'Withdrawal Completed',
    `Your withdrawal of ${amount.toLocaleString()} UGX has been completed successfully`,
    { amount }
  )
}

export async function notifyWithdrawalFailed(userId: string, amount: number, reason?: string) {
  await createNotification(
    userId,
    'WITHDRAWAL_FAILED',
    'Withdrawal Failed',
    `Your withdrawal of ${amount.toLocaleString()} UGX has failed. ${reason || 'Please try again or contact support.'}`,
    { amount }
  )
}

/**
 * Create notifications for review events
 */
export async function notifyReviewReceived(userId: string, reviewerName: string, rating: number, taskId: string) {
  await createNotification(
    userId,
    'REVIEW_RECEIVED',
    'New Review Received',
    `${reviewerName} left you a ${rating}-star review`,
    { taskId, rating }
  )
}

/**
 * Create notifications for dispute events
 */
export async function notifyDisputeOpened(taskId: string, openerId: string, otherUserId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  })

  if (!task) return

  await createNotification(
    otherUserId,
    'DISPUTE_OPENED',
    'Dispute Opened',
    `A dispute has been opened for your ${task.category} task`,
    { taskId, disputeId: taskId }
  )
}

export async function notifyDisputeResolved(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { dispute: true },
  })

  if (!task || !task.dispute) return

  await createNotification(
    userId,
    'DISPUTE_RESOLVED',
    'Dispute Resolved',
    `The dispute for your ${task.category} task has been resolved`,
    { taskId, disputeId: taskId, resolution: task.dispute.resolution }
  )
}

/**
 * Create notifications for broadcast tasks
 */
export async function notifyBroadcastTask(taskId: string, stewardIds: string[]) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { client: true },
  })

  if (!task) return

  // Create notifications for all eligible stewards
  await Promise.all(
    stewardIds.map((stewardId) =>
      createNotification(
        stewardId,
        'BROADCAST_TASK',
        'New Task Available',
        `A new ${task.category} task is available near you. Price: ${task.agreedPrice.toLocaleString()} UGX`,
        { taskId, amount: task.agreedPrice }
      )
    )
  )
}

