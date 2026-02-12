import { prisma } from '@/lib/prisma'
import { processRefund } from '@/lib/flutterwave'

export interface RefundResult {
  success: boolean
  refundTransactionId?: string
  flutterwaveRefundId?: string
  amount: number
  error?: string
}

/**
 * Process a refund for a task
 * @param taskId - The task ID to refund
 * @param reason - Reason for refund
 * @param refundAmount - Optional: specific amount to refund (defaults to full payment)
 * @returns Refund result
 */
export async function processTaskRefund(
  taskId: string,
  reason: string,
  refundAmount?: number
): Promise<RefundResult> {
  try {
    // Get the task with its transactions
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        transactions: {
          where: {
            type: 'CHARGE',
            status: 'COMPLETED'
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!task) {
      return {
        success: false,
        amount: 0,
        error: 'Task not found'
      }
    }

    // Find the completed payment transaction
    const paymentTransaction = task.transactions.find(
      t => t.type === 'CHARGE' && t.status === 'COMPLETED'
    )

    if (!paymentTransaction) {
      return {
        success: false,
        amount: 0,
        error: 'No completed payment found for this task'
      }
    }

    if (!paymentTransaction.providerTransactionId) {
      return {
        success: false,
        amount: 0,
        error: 'Payment transaction does not have a Flutterwave transaction ID'
      }
    }

    // Check if refund already exists
    const existingRefund = await prisma.transaction.findFirst({
      where: {
        taskId,
        type: 'REFUND',
        status: 'COMPLETED'
      }
    })

    if (existingRefund) {
      return {
        success: false,
        amount: 0,
        error: 'Refund already processed for this task'
      }
    }

    // Calculate refund amount (full refund if not specified)
    const amountToRefund = refundAmount || paymentTransaction.amount

    if (amountToRefund > paymentTransaction.amount) {
      return {
        success: false,
        amount: 0,
        error: 'Refund amount cannot exceed payment amount'
      }
    }

    // Process refund with Flutterwave
    let flwRefundResponse
    try {
      flwRefundResponse = await processRefund({
        id: paymentTransaction.providerTransactionId,
        amount: amountToRefund,
        comments: reason
      })
    } catch (error: any) {
      console.error('Flutterwave refund error:', error)
      return {
        success: false,
        amount: amountToRefund,
        error: `Flutterwave refund failed: ${error.message || 'Unknown error'}`
      }
    }

    // Create refund transaction record
    const refundTransaction = await prisma.transaction.create({
      data: {
        taskId,
        amount: amountToRefund,
        platformFee: 0, // Refunds don't have platform fees
        type: 'REFUND',
        status: flwRefundResponse.status === 'success' ? 'COMPLETED' : 'PENDING',
        providerTransactionId: flwRefundResponse.data?.id?.toString(),
        paymentMethod: paymentTransaction.paymentMethod,
        metadata: {
          reason,
          originalTransactionId: paymentTransaction.id,
          flwResponse: flwRefundResponse.data,
          refundType: refundAmount ? 'PARTIAL' : 'FULL'
        }
      }
    })

    return {
      success: true,
      refundTransactionId: refundTransaction.id,
      flutterwaveRefundId: flwRefundResponse.data?.id?.toString(),
      amount: amountToRefund
    }
  } catch (error: any) {
    console.error('Refund processing error:', error)
    return {
      success: false,
      amount: 0,
      error: error.message || 'Failed to process refund'
    }
  }
}

