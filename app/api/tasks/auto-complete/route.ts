import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { $Enums } from '@prisma/client'
import { addHours, isBefore } from 'date-fns'
import { notifyAdminsOfHighSeverityEvent } from '@/lib/notifications/admin-alerts'

/**
 * Auto-complete tasks that have been DONE for 24+ hours without client confirmation
 * BR-3: Task auto-complete after 24 hours if not confirmed
 * 
 * This endpoint should be called by a cron job (e.g., Vercel Cron, external service)
 * Recommended: Run every hour to check for tasks that need auto-completion
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
    const twentyFourHoursAgo = addHours(now, -24)

    // Find tasks that:
    // 1. Are in DONE status (steward marked as complete)
    // 2. Have been DONE for 24+ hours (actualEnd is 24+ hours ago)
    // 3. Don't have a completed payout (payment not yet released)
    const tasksToAutoComplete = await prisma.task.findMany({
      where: {
        status: 'DONE',
        actualEnd: {
          not: null,
          lte: twentyFourHoursAgo
        },
        transactions: {
          none: {
            type: 'PAYOUT',
            status: $Enums.TransactionStatus.COMPLETED
          }
        }
      },
      include: {
        transactions: {
          where: {
            type: 'CHARGE',
            status: $Enums.TransactionStatus.HELD
          }
        },
        client: true,
        steward: true
      }
    })

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const task of tasksToAutoComplete) {
      try {
        // Escrow integrity: ensure exactly one HELD CHARGE exists for this task
        const charges = await prisma.transaction.findMany({
          where: { taskId: task.id, type: 'CHARGE', status: $Enums.TransactionStatus.HELD }
        })
        if (charges.length !== 1) {
          console.error('Escrow integrity violation: invalid CHARGE count', { taskId: task.id, count: charges.length })
          const event = await prisma.securityEvent.create({
            data: {
              type: 'ESCROW_INTEGRITY_VIOLATION',
              severity: 'HIGH',
              details: { taskId: task.id, count: charges.length, action: 'auto_complete' }
            }
          })
          notifyAdminsOfHighSeverityEvent(event)
          
          // No payout, just skip this task
          results.failed++
          results.errors.push(`Task ${task.id}: Escrow integrity violation`)
          continue
        }
        const paymentTransaction = charges[0]

        if (!paymentTransaction) {
          // No payment to release, just mark as auto-completed
          await prisma.task.update({
            where: { id: task.id },
            data: {
              // Task is already DONE, no need to change status
              // But we could add a flag or metadata to indicate auto-completion
            }
          })
          results.processed++
          continue
        }

        // Check if payout already exists (prevent duplicates)
        const existingPayout = await prisma.transaction.findFirst({
          where: {
            taskId: task.id,
            type: 'PAYOUT',
            status: 'COMPLETED'
          }
        })

        if (existingPayout) {
          // Payout already exists, skip
          continue
        }

        // Calculate payout amount (task price - platform fee)
        const platformFee = paymentTransaction.platformFee
        const payoutAmount = paymentTransaction.amount - platformFee

        // Release escrow and create payout (auto-released)
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: paymentTransaction.id },
            data: {
              status: $Enums.TransactionStatus.RELEASED,
              metadata: {
                ...(paymentTransaction.metadata as any),
                autoRelease: true,
                autoReleasedAt: now.toISOString(),
              },
            },
          }),
          prisma.transaction.create({
            data: {
              taskId: task.id,
              clientId: task.clientId,
              stewardId: task.stewardId || undefined,
              amount: payoutAmount,
              platformFee: 0,
              type: 'PAYOUT',
              status: $Enums.TransactionStatus.COMPLETED,
              paymentMethod: paymentTransaction.paymentMethod,
              metadata: {
                autoCompleted: true,
                autoCompletedAt: now.toISOString(),
                reason: 'Auto-completed after 24 hours without client confirmation',
                originalChargeId: paymentTransaction.id,
              },
            },
          }),
          prisma.task.update({
            where: { id: task.id },
            data: { status: $Enums.TaskStatus.DONE },
          }),
        ])

        // Update steward's completed tasks count
        if (task.stewardId) {
          await prisma.stewardProfile.updateMany({
            where: { userId: task.stewardId },
            data: {
              completedTasks: {
                increment: 1
              }
            }
          })
        }

        results.processed++
      } catch (error: any) {
        console.error(`Error auto-completing task ${task.id}:`, error)
        results.failed++
        results.errors.push(`Task ${task.id}: ${error.message || 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-completion check completed`,
      data: {
        checked: tasksToAutoComplete.length,
        processed: results.processed,
        failed: results.failed,
        errors: results.errors
      }
    })
  } catch (error: any) {
    console.error('Auto-completion error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process auto-completion' },
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
