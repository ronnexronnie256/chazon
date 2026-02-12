import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isBefore } from 'date-fns'
import { processTaskRefund } from '@/lib/refunds'

/**
 * Expire tasks that have passed their expiry date without being accepted
 * FR-11: Task expiry logic
 * 
 * This endpoint should be called by a cron job (e.g., Vercel Cron, external service)
 * Recommended: Run every hour to check for expired tasks
 */
export async function POST(req: Request) {
  try {
    // Optional: Add authentication/authorization for cron job
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Find tasks that:
    // 1. Are in OPEN status
    // 2. Have an expiry date that has passed
    // 3. Are not already marked as expired
    const expiredTasks = await prisma.task.findMany({
      where: {
        status: 'OPEN',
        isExpired: false,
        expiresAt: {
          not: null,
          lte: now
        }
      },
      include: {
        transactions: {
          where: {
            type: 'CHARGE',
            status: 'COMPLETED'
          }
        },
        client: true
      }
    })

    const results = {
      processed: 0,
      refunded: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const task of expiredTasks) {
      try {
        // Check if payment was made
        const paymentTransaction = task.transactions.find(
          t => t.type === 'CHARGE' && t.status === 'COMPLETED'
        )

        // If payment was made, process refund
        if (paymentTransaction) {
          const refundResult = await processTaskRefund(
            task.id,
            'Task expired without steward acceptance - automatic refund'
          )

          if (refundResult.success) {
            results.refunded++
          } else {
            console.error(`Refund failed for expired task ${task.id}:`, refundResult.error)
            // Continue with expiry even if refund fails (admin can handle manually)
          }
        }

        // Mark task as expired
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'EXPIRED',
            isExpired: true
          }
        })

        results.processed++
      } catch (error: any) {
        console.error(`Error expiring task ${task.id}:`, error)
        results.failed++
        results.errors.push(`Task ${task.id}: ${error.message || 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Task expiry check completed`,
      data: {
        checked: expiredTasks.length,
        processed: results.processed,
        refunded: results.refunded,
        failed: results.failed,
        errors: results.errors
      }
    })
  } catch (error: any) {
    console.error('Task expiry error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process task expiry' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for manual testing
 */
export async function GET(req: Request) {
  return POST(req)
}

