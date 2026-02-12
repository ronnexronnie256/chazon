import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/clerk/auth'
import { getSystemConfig } from '@/lib/config'
import { prisma } from '@/lib/prisma'
import { $Enums } from '@prisma/client'
import { processTaskRefund } from '@/lib/refunds'
import {
  notifyTaskAccepted,
  notifyTaskStarted,
  notifyTaskCompleted,
  notifyTaskConfirmed,
  notifyTaskCancelled,
  notifyPaymentReleased,
} from '@/lib/notifications'
import { notifyAdminsOfHighSeverityEvent } from '@/lib/notifications/admin-alerts'

// Helper to map Task to Booking
const mapTaskToBooking = (task: any) => {
  // Find completed CHARGE transaction (payment)
  const completedPayment = task.transactions?.find(
    (t: any) => t.type === 'CHARGE' && t.status === 'HELD'
  )
  
  // Find completed PAYOUT transaction (payment released to steward)
  const completedPayout = task.transactions?.find(
    (t: any) => t.type === 'PAYOUT' && t.status === 'COMPLETED'
  )
  
  // Check if payment has been made
  const isPaid = !!completedPayment
  // Check if payment has been released to steward
  const isPaymentReleased = !!completedPayout
  
  return {
    id: task.id,
    status: mapStatus(task.status),
    scheduledDate: task.scheduledStart.toISOString(),
    scheduledTime: task.scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    address: task.address,
    notes: task.description,
    stewardId: task.stewardId, // Include stewardId for role checking
    clientId: task.clientId, // Include clientId for role checking
    isPaid, // Payment status
    isPaymentReleased, // Whether payment has been released to steward
    paymentTransaction: completedPayment ? {
      id: completedPayment.id,
      amount: completedPayment.amount,
      currency: task.currency,
      paymentMethod: completedPayment.paymentMethod,
      completedAt: completedPayment.createdAt,
    } : null,
    payoutTransaction: completedPayout ? {
      id: completedPayout.id,
      amount: completedPayout.amount,
      releasedAt: completedPayout.createdAt,
    } : null,
    client: task.client ? {
      id: task.client.id,
      name: task.client.name,
      image: task.client.image,
    } : null,
    service: {
      id: task.id,
      title: task.category,
      description: task.description || "",
      price: task.agreedPrice,
      currency: task.currency,
      duration: 60,
      images: task.steward?.image ? [task.steward.image] : [],
      category: { 
        id: task.category.toLowerCase(), 
        name: task.category, 
        slug: task.category.toLowerCase() 
      },
      steward: {
        id: task.steward?.id || '',
        name: task.steward?.name || '',
        image: task.steward?.image,
        rating: 0,
      }
    }
  }
}

const mapStatus = (status: string) => {
  switch (status) {
    case 'OPEN': return 'PENDING'
    case 'ASSIGNED': return 'CONFIRMED'
    case 'IN_PROGRESS': return 'IN_PROGRESS'
    case 'DONE': return 'COMPLETED'
    case 'CANCELLED': return 'CANCELLED'
    default: return 'PENDING'
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        client: true,
        steward: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!task) {
    return NextResponse.json(
      { success: false, error: 'Booking not found' },
      { status: 404 }
    )
  }

    // Check if user has access to this task
    // Allow access if:
    // - User is the client
    // - User is the assigned steward (or any steward for broadcast tasks)
    // - User is admin
    const isClient = task.clientId === user.id
    const isAssignedSteward = task.stewardId === user.id
    const isBroadcastTask = !task.stewardId
    const isStewardForBroadcast = isBroadcastTask && user.role === 'STEWARD'
    const isAdmin = user.role === 'ADMIN'
    
    if (!isClient && !isAssignedSteward && !isStewardForBroadcast && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

  return NextResponse.json({
    success: true,
      data: mapTaskToBooking(task),
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

// PATCH endpoint for task status updates
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { action } = body

    // Kill Switch: Check for blocked actions
    const config = await getSystemConfig()
    
    if (action === 'accept' && !config.stewardAcceptEnabled) {
      // Log Security Event
      try {
        await prisma.securityEvent.create({
          data: {
            type: 'STEWARD_ACCEPT_BLOCKED',
            severity: 'MEDIUM',
            userId: user.id,
            details: { 
              taskId: id,
              reason: 'Kill switch active: STEWARD_ACCEPT_ENABLED=false' 
            }
          }
        })
      } catch (e) { console.error(e) }

      return NextResponse.json(
        { success: false, error: 'Task acceptance is temporarily disabled.' },
        { status: 503 }
      )
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Validate user has permission
    const isClient = task.clientId === user.id
    const isSteward = task.stewardId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isClient && !isSteward && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    let updatedTask
    let updateData: any = {}

    switch (action) {
      case 'accept':
        // Steward accepts task (OPEN → ASSIGNED)
        // Supports both direct booking (already has stewardId) and broadcast booking (stewardId is null)
        // For broadcast tasks, any steward can accept
        const canAccept = isSteward || isAdmin || (!task.stewardId && user.role === 'STEWARD')
        if (!canAccept) {
          return NextResponse.json(
            { success: false, error: 'Only stewards can accept tasks' },
            { status: 403 }
          )
        }

        // Ensure steward is APPROVED (unless admin)
        if (!isAdmin) {
          const stewardProfile = await prisma.stewardProfile.findUnique({
            where: { userId: user.id }
          })
          if (!stewardProfile || stewardProfile.status !== 'APPROVED') {
            return NextResponse.json(
              { success: false, error: 'Steward is not approved to perform this action' },
              { status: 403 }
            )
          }
        }

        if (task.status !== 'OPEN') {
          return NextResponse.json(
            { success: false, error: `Task cannot be accepted. Current status: ${task.status}` },
            { status: 400 }
          )
        }
        // Check if task is expired
        if (task.isExpired || (task.expiresAt && new Date() > task.expiresAt)) {
          return NextResponse.json(
            { success: false, error: 'This task has expired and can no longer be accepted' },
            { status: 400 }
          )
        }
        // Verify payment has been made before allowing acceptance
        const hasPayment = task.transactions.some(
          t => t.type === 'CHARGE' && t.status === $Enums.TransactionStatus.HELD
        )
        if (!hasPayment) {
          return NextResponse.json(
            { success: false, error: 'Payment must be completed before accepting task' },
            { status: 400 }
          )
        }
        // For broadcast tasks, assign the steward who accepts
        if (!task.stewardId) {
          updateData.stewardId = user.id
        } else if (task.stewardId !== user.id && !isAdmin) {
          // For direct booking, only the assigned steward can accept
          return NextResponse.json(
            { success: false, error: 'This task is assigned to another steward' },
            { status: 403 }
          )
        }
        updateData.status = 'ASSIGNED'
        // Notify client that task was accepted
        await notifyTaskAccepted(id, task.clientId).catch(console.error)
        break

      case 'start':
        // Steward starts work (ASSIGNED → IN_PROGRESS)
        if (!isSteward && !isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Only stewards can start tasks' },
            { status: 403 }
          )
        }

        // Ensure steward is APPROVED (unless admin)
        if (!isAdmin) {
          const stewardProfile = await prisma.stewardProfile.findUnique({
            where: { userId: user.id }
          })
          if (!stewardProfile || stewardProfile.status !== 'APPROVED') {
            return NextResponse.json(
              { success: false, error: 'Steward is not approved to perform this action' },
              { status: 403 }
            )
          }
        }

        if (task.status !== 'ASSIGNED') {
          return NextResponse.json(
            { success: false, error: `Task cannot be started. Current status: ${task.status}` },
            { status: 400 }
          )
        }
        updateData.status = 'IN_PROGRESS'
        updateData.actualStart = new Date()
        // Notify client that task was started
        await notifyTaskStarted(id, task.clientId).catch(console.error)
        break

      case 'complete':
        // Steward marks task as complete (IN_PROGRESS → DONE)
        if (!isSteward && !isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Only stewards can complete tasks' },
            { status: 403 }
          )
        }

        // Ensure steward is APPROVED (unless admin)
        if (!isAdmin) {
          const stewardProfile = await prisma.stewardProfile.findUnique({
            where: { userId: user.id }
          })
          if (!stewardProfile || stewardProfile.status !== 'APPROVED') {
            return NextResponse.json(
              { success: false, error: 'Steward is not approved to perform this action' },
              { status: 403 }
            )
          }
        }

        if (task.status !== 'IN_PROGRESS') {
          return NextResponse.json(
            { success: false, error: `Task cannot be completed. Current status: ${task.status}` },
            { status: 400 }
          )
        }
        updateData.status = 'DONE'
        updateData.actualEnd = new Date()
        // Notify client that task was completed
        await notifyTaskCompleted(id, task.clientId).catch(console.error)
        break

      case 'confirm':
        // Client confirms completion and releases payment (DONE → payment released)
        // FR-19: Tips support - optional tip amount can be included
        if (!isClient && !isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Only clients can confirm completion' },
            { status: 403 }
          )
        }
        if (task.status !== 'DONE') {
          return NextResponse.json(
            { success: false, error: `Task cannot be confirmed. Current status: ${task.status}` },
            { status: 400 }
          )
        }
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
              details: { taskId: task.id, count: charges.length, action: 'client_confirm_patch' }
            }
          })
          notifyAdminsOfHighSeverityEvent(event)
          
          return NextResponse.json(
            { success: false, error: 'Escrow integrity violation: invalid CHARGE count' },
            { status: 400 }
          )
        }
        const completedTransaction = charges[0]

        // Check if payout already exists to prevent duplicates
        const existingPayout = task.transactions.find(
          t => t.type === 'PAYOUT' && t.status === 'COMPLETED'
        )
        if (existingPayout) {
          return NextResponse.json(
            { success: false, error: 'Payment has already been released to steward' },
            { status: 400 }
          )
        }

        // Get optional tip amount from request body (FR-19: Tips support)
        const tipAmount = body.tipAmount ? parseFloat(body.tipAmount) : 0

        // Validate tip amount
        if (tipAmount < 0) {
          return NextResponse.json(
            { success: false, error: 'Tip amount cannot be negative' },
            { status: 400 }
          )
        }

        // Check if task uses milestone payments (PRD 6.6: Partial payments)
        const milestones = await prisma.paymentMilestone.findMany({
          where: { taskId: task.id },
        })

        if (milestones.length > 0) {
          // For milestone-based tasks, check if all milestones are completed
          const allMilestonesCompleted = milestones.every((m) => m.status === 'COMPLETED')
          
          if (!allMilestonesCompleted) {
            return NextResponse.json(
              { success: false, error: 'All milestones must be completed before final confirmation' },
              { status: 400 }
            )
          }

          // For milestone tasks, payouts are already released per milestone
          // Just mark the task as confirmed
        } else {
          const stewardAmount = completedTransaction.amount - completedTransaction.platformFee
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: completedTransaction.id },
              data: {
                status: $Enums.TransactionStatus.RELEASED,
                metadata: {
                  ...(completedTransaction.metadata as any),
                  releasedAt: new Date().toISOString(),
                  releasedBy: user.id,
                },
              },
            }),
            prisma.transaction.create({
              data: {
                taskId: task.id,
                amount: stewardAmount,
                platformFee: 0,
                type: 'PAYOUT',
                status: $Enums.TransactionStatus.COMPLETED,
                metadata: {
                  originalTransactionId: completedTransaction.id,
                  platformFee: completedTransaction.platformFee,
                  releasedAt: new Date().toISOString(),
                },
              },
            }),
            prisma.task.update({
              where: { id },
              data: { status: $Enums.TaskStatus.DONE, actualEnd: task.actualEnd ?? new Date() },
            }),
          ])
        }

        // Create tip transaction if tip amount is provided (FR-19)
        if (tipAmount > 0) {
          await prisma.transaction.create({
            data: {
              taskId: task.id,
              amount: tipAmount,
              platformFee: 0, // Tips go 100% to steward, no platform fee
              type: 'TIP',
              status: $Enums.TransactionStatus.COMPLETED,
              metadata: {
                tipFrom: user.id,
                tipTo: task.stewardId,
                tipAmount: tipAmount,
                currency: task.currency,
                tippedAt: new Date().toISOString(),
              },
            },
          })
        }

        // Update steward's completed tasks count (only if steward is assigned)
        if (task.stewardId) {
          const stewardProfile = await prisma.stewardProfile.findUnique({
            where: { userId: task.stewardId },
          })

          if (stewardProfile) {
            await prisma.stewardProfile.update({
              where: { userId: task.stewardId },
              data: {
                completedTasks: {
                  increment: 1,
                },
              },
            })
          }
        }

        // Fetch updated task with all relations
        const updatedTask = await prisma.task.findUnique({
          where: { id },
          include: {
            steward: true,
            client: true,
            transactions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        })

        // Notify steward that task was confirmed and payment released
        if (updatedTask?.stewardId) {
          await notifyTaskConfirmed(id, updatedTask.stewardId).catch(console.error)
          // Also notify about payment release
          const payoutTransaction = updatedTask.transactions?.find(
            (t: any) => t.type === 'PAYOUT' && t.status === 'COMPLETED'
          )
          if (payoutTransaction) {
            await notifyPaymentReleased(
              updatedTask.stewardId,
              payoutTransaction.amount,
              id
            ).catch(console.error)
          }
        }

        // Task status set to COMPLETED after client confirmation
        return NextResponse.json({
          success: true,
          message: 'Task confirmed and payment released to steward',
          data: mapTaskToBooking(updatedTask),
        })

      case 'cancel':
        // Cancel task (any status → CANCELLED)
        if (task.status === 'CANCELLED' || task.status === 'DONE') {
          return NextResponse.json(
            { success: false, error: `Task cannot be cancelled. Current status: ${task.status}` },
            { status: 400 }
          )
        }
        // Only client or admin can cancel before acceptance
        if (task.status === 'OPEN' && !isClient && !isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Only clients can cancel unassigned tasks' },
            { status: 403 }
          )
        }
        // After acceptance, both client and steward can cancel (with refund logic)
        if (task.status !== 'OPEN' && !isClient && !isSteward && !isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized to cancel this task' },
            { status: 403 }
          )
        }

        // Ensure steward is APPROVED (unless admin or client)
        // If the user is acting as the steward, they must be approved
        if (isSteward && !isClient && !isAdmin) {
          const stewardProfile = await prisma.stewardProfile.findUnique({
            where: { userId: user.id }
          })
          if (!stewardProfile || stewardProfile.status !== 'APPROVED') {
            return NextResponse.json(
              { success: false, error: 'Steward is not approved to perform this action' },
              { status: 403 }
            )
          }
        }

        updateData.status = 'CANCELLED'

        // BR-1: Task cancellation before acceptance = full refund
        // Check if task was cancelled before acceptance (status is OPEN)
        if (task.status === 'OPEN') {
          // Check if payment was made
          const hasPayment = await prisma.transaction.findFirst({
            where: {
              taskId: id,
              type: 'CHARGE',
              status: 'COMPLETED'
            }
          })

          if (hasPayment) {
            // Process full refund
            const refundResult = await processTaskRefund(
              id,
              `Task cancelled before acceptance by ${isAdmin ? 'admin' : 'client'}`
            )

            if (!refundResult.success) {
              // Log error but don't fail the cancellation
              console.error('Refund failed during cancellation:', refundResult.error)
              // Continue with cancellation even if refund fails (admin can handle manually)
            }
          }
        }
        // Note: Cancellation after acceptance doesn't automatically trigger refund
        // This can be handled manually by admin or through dispute resolution
        break

      case 'no-show':
        // BR-2: No-show by steward = client refund
        // Only client or admin can report no-show
        if (!isClient && !isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Only clients or admins can report no-show' },
            { status: 403 }
          )
        }
        // No-show can only be reported for ASSIGNED tasks (steward accepted but didn't show)
        if (task.status !== 'ASSIGNED') {
          return NextResponse.json(
            { success: false, error: `No-show can only be reported for ASSIGNED tasks. Current status: ${task.status}` },
            { status: 400 }
          )
        }
        // Check if payment was made
        const hasPaymentForNoShow = await prisma.transaction.findFirst({
          where: {
            taskId: id,
            type: 'CHARGE',
            status: $Enums.TransactionStatus.HELD
          }
        })

        if (!hasPaymentForNoShow) {
          return NextResponse.json(
            { success: false, error: 'No payment found to refund' },
            { status: 400 }
          )
        }

        // Process refund for no-show
        const noShowRefundResult = await processTaskRefund(
          id,
          `No-show reported by ${isAdmin ? 'admin' : 'client'} - steward did not show up`
        )

        if (!noShowRefundResult.success) {
          return NextResponse.json(
            { success: false, error: `Failed to process refund: ${noShowRefundResult.error}` },
            { status: 500 }
          )
        }

        // Mark task as cancelled due to no-show
        updateData.status = 'CANCELLED'
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        steward: true,
        client: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: mapTaskToBooking(updatedTask),
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
