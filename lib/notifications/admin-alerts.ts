import { SecurityEvent } from '@prisma/client'

export async function notifyAdminsOfHighSeverityEvent(event: SecurityEvent) {
  // In a real application, this would send an email or Slack notification
  // For now, we'll just log it to the console
  console.error('[ADMIN ALERT] High Severity Security Event:', {
    type: event.type,
    severity: event.severity,
    details: event.details,
    userId: event.userId,
    createdAt: event.createdAt
  })
}
