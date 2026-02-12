import { prisma } from "@/lib/prisma"
import { verifyTransaction } from "@/lib/flutterwave"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const tx_ref = searchParams.get('tx_ref')
  const transaction_id = searchParams.get('transaction_id')
  const milestoneId = searchParams.get('milestoneId') // For milestone payments

  // Get base URL - use NEXT_PUBLIC_APP_URL if available, otherwise derive from request
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (req.headers.get('origin') || 
     (req.headers.get('host') ? `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}` : 'http://localhost:3000'))

  if (status !== 'successful' && status !== 'completed') {
    return NextResponse.redirect(new URL('/bookings?payment=failed', baseUrl))
  }

  if (!tx_ref || !transaction_id) {
    return NextResponse.json({ error: "Invalid callback params" }, { status: 400 })
  }

  try {
    const flwData = await verifyTransaction(transaction_id)
    
    if (flwData.status === 'success') {
       // Update transaction
       const updatedTransaction = await prisma.transaction.update({
         where: { id: tx_ref },
         data: {
           status: 'COMPLETED',
           providerTransactionId: transaction_id,
           paymentMethod: flwData.data.payment_type,
           metadata: flwData.data,
         },
         include: {
           task: true,
           milestone: true,
         },
       })
       
      // Handle milestone payment (PRD 6.6: Partial payments)
      if (milestoneId && updatedTransaction.milestoneId) {
        // Update milestone status to IN_PROGRESS when paid
        await prisma.paymentMilestone.update({
          where: { id: milestoneId },
          data: {
            status: 'IN_PROGRESS',
          },
        })

        // Release payment to steward for this milestone
        const stewardAmount = updatedTransaction.amount - updatedTransaction.platformFee
        await prisma.transaction.create({
          data: {
            taskId: updatedTransaction.taskId,
            milestoneId: milestoneId,
            amount: stewardAmount,
            platformFee: 0,
            type: 'PAYOUT',
            status: 'COMPLETED',
            metadata: {
              originalTransactionId: updatedTransaction.id,
              platformFee: updatedTransaction.platformFee,
              releasedAt: new Date().toISOString(),
              milestonePayment: true,
            },
          },
        })

        return NextResponse.redirect(new URL(`/booking/confirmation/${updatedTransaction.taskId}?payment=success&milestone=${milestoneId}`, baseUrl))
      }

      // Update Task status when payment is successful (for full payment)
      // If task is OPEN, update to ASSIGNED (which shows as CONFIRMED in booking view)
      // This indicates payment has been made and the booking is confirmed
      if (updatedTransaction.task && updatedTransaction.task.status === 'OPEN') {
        await prisma.task.update({
          where: { id: updatedTransaction.task.id },
          data: {
            status: 'ASSIGNED',
          },
        })
      }
      
      return NextResponse.redirect(new URL(`/bookings?payment=success&tid=${updatedTransaction.id}`, baseUrl))
    }
  } catch (error) {
     console.error("Payment verification error:", error)
  }
  
  return NextResponse.redirect(new URL('/bookings?payment=error', baseUrl))
}
