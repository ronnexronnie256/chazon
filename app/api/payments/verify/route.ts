import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const tx_ref = searchParams.get('tx_ref');
  const transaction_id = searchParams.get('transaction_id');
  const taskId = searchParams.get('taskId');

  // Get base URL
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.headers.get('origin') ||
    `http://localhost:3000`;

  if (status !== 'successful' && status !== 'completed') {
    return NextResponse.redirect(new URL('/bookings?payment=failed', baseUrl));
  }

  if (!tx_ref || !transaction_id) {
    return NextResponse.redirect(new URL('/bookings?payment=error', baseUrl));
  }

  try {
    // Verify with Flutterwave API directly
    const secretKey = process.env.FLUTTERWAVE_SECRET?.trim();

    if (!secretKey) {
      console.error('Flutterwave secret key not configured');
      return NextResponse.redirect(new URL('/bookings?payment=error', baseUrl));
    }

    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const flwData = await verifyResponse.json();

    if (flwData.status === 'success' && flwData.data) {
      // Update transaction
      const updatedTransaction = await prisma.transaction.update({
        where: { id: tx_ref },
        data: {
          status: 'HELD',
          providerTransactionId: transaction_id,
          paymentMethod: flwData.data.payment_type || 'mobile_money',
          metadata: {
            ...flwData.data,
            verifiedAt: new Date().toISOString(),
          },
        },
        include: {
          task: true,
        },
      });

      // Update Task status to ASSIGNED (payment confirmed)
      if (
        updatedTransaction.task &&
        updatedTransaction.task.status === 'OPEN'
      ) {
        await prisma.task.update({
          where: { id: updatedTransaction.task.id },
          data: {
            status: 'ASSIGNED',
          },
        });
      }

      const redirectUrl = taskId
        ? `/booking/confirmation/${taskId}?payment=success`
        : `/bookings?payment=success`;

      return NextResponse.redirect(new URL(redirectUrl, baseUrl));
    }
  } catch (error) {
    console.error('Payment verification error:', error);
  }

  return NextResponse.redirect(new URL('/bookings?payment=error', baseUrl));
}
