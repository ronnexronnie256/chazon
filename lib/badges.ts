import { prisma } from '@/lib/prisma'

export type BadgeType = 'VERIFIED' | 'TOP_RATED' | 'FAST_RESPONDER'

export interface Badge {
  type: BadgeType
  label: string
  description: string
  icon: string
}

/**
 * Calculate which badges a steward should have
 */
export async function calculateStewardBadges(stewardId: string): Promise<Badge[]> {
  const badges: Badge[] = []

  // Get steward profile
  const stewardProfile = await prisma.stewardProfile.findUnique({
    where: { userId: stewardId },
  })

  if (!stewardProfile) {
    return badges
  }

  // Get tasks for this steward with messages
  const tasks = await prisma.task.findMany({
    where: {
      stewardId: stewardId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!stewardProfile) {
    return badges
  }

  // 1. Verified Badge - Status is APPROVED
  if (stewardProfile.status === 'APPROVED') {
    badges.push({
      type: 'VERIFIED',
      label: 'Verified',
      description: 'Identity and background verified',
      icon: '✓',
    })
  }

  // 2. Top Rated Badge - High rating (≥4.5) and sufficient reviews (≥10 completed tasks)
  if (stewardProfile.rating >= 4.5 && stewardProfile.completedTasks >= 10) {
    badges.push({
      type: 'TOP_RATED',
      label: 'Top Rated',
      description: `Excellent ${stewardProfile.rating.toFixed(1)}★ rating`,
      icon: '⭐',
    })
  }

  // 3. Fast Responder Badge - Average response time < 2 hours
  const fastResponderThreshold = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
  const averageResponseTime = calculateAverageResponseTime(stewardId, tasks)

  if (averageResponseTime > 0 && averageResponseTime < fastResponderThreshold) {
    const hours = Math.round(averageResponseTime / (60 * 60 * 1000) * 10) / 10
    badges.push({
      type: 'FAST_RESPONDER',
      label: 'Fast Responder',
      description: `Responds in ~${hours}h on average`,
      icon: '⚡',
    })
  }

  return badges
}

/**
 * Calculate average response time for a steward
 * Response time is measured from when a client sends a message to when the steward responds
 */
function calculateAverageResponseTime(
  stewardId: string,
  tasks: Array<{
    messages: Array<{
      senderId: string
      createdAt: Date
    }>
  }>
): number {
  const responseTimes: number[] = []

  for (const task of tasks) {
    const messages = task.messages
    if (messages.length < 2) continue // Need at least 2 messages

    // Find pairs where client sends, then steward responds
    for (let i = 0; i < messages.length - 1; i++) {
      const currentMessage = messages[i]
      const nextMessage = messages[i + 1]

      // If current message is from client and next is from steward
      if (currentMessage.senderId !== stewardId && nextMessage.senderId === stewardId) {
        const responseTime = new Date(nextMessage.createdAt).getTime() - new Date(currentMessage.createdAt).getTime()
        if (responseTime > 0 && responseTime < 24 * 60 * 60 * 1000) {
          // Only count responses within 24 hours (reasonable response time)
          responseTimes.push(responseTime)
        }
      }
    }
  }

  if (responseTimes.length === 0) {
    return 0
  }

  // Calculate average
  const sum = responseTimes.reduce((acc, time) => acc + time, 0)
  return sum / responseTimes.length
}

/**
 * Get badge display information
 */
export function getBadgeDisplay(badgeType: BadgeType) {
  const badges: Record<BadgeType, { label: string; description: string; color: string; bgColor: string }> = {
    VERIFIED: {
      label: 'Verified',
      description: 'Background check cleared',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
    },
    TOP_RATED: {
      label: 'Top Rated',
      description: 'Excellent rating',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
    },
    FAST_RESPONDER: {
      label: 'Fast Responder',
      description: 'Quick response time',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    },
  }

  return badges[badgeType]
}

