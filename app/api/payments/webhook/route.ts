import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, verifyTransaction } from '@/lib/flutterwave';
import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';
import {
  notifyPaymentReceived,
  notifyWithdrawalCompleted,
  notifyWithdrawalFailed,
} from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('verif-hash');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing verif-hash header' },
        { status: 401 }
      );
    }

    const payload = await req.json();

    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = payload.event;
    const eventData = payload.data;

    console.log('Flutterwave webhook received:', {
      event,
      tx_ref: eventData?.tx_ref,
    });

    switch (event) {
      case 'charge.completed':
      case 'charge.successful': {
        const verification = await verifyTransaction(eventData.id);

        if (verification.status === 'success' && eventData?.tx_ref) {
          const transaction = await prisma.transaction.findUnique({
            where: { id: eventData.tx_ref },
            include: { task: true },
          });

          if (
            transaction &&
            transaction.status !== $Enums.TransactionStatus.HELD
          ) {
            await prisma.transaction.update({
              where: { id: eventData.tx_ref },
              data: {
                status: $Enums.TransactionStatus.HELD,
                providerTransactionId:
                  eventData.id?.toString() || eventData.flw_ref,
                paymentMethod: eventData.payment_type || 'mobile_money',
                metadata: eventData,
              },
            });

            // Update task status
            if (transaction.task?.status === 'OPEN') {
              await prisma.task.update({
                where: { id: transaction.task.id },
                data: { status: 'ASSIGNED' },
              });
            }

            if (transaction.task) {
              await notifyPaymentReceived(
                transaction.task.clientId,
                transaction.amount,
                transaction.task.id
              ).catch(console.error);
            }
          }
        }
        break;
      }

      case 'charge.failed': {
        if (eventData?.tx_ref) {
          await prisma.transaction.update({
            where: { id: eventData.tx_ref },
            data: {
              status: 'FAILED',
              metadata: eventData,
            },
          });
        }
        break;
      }

      case 'transfer.completed':
      case 'transfer.successful': {
        if (eventData?.reference) {
          const withdrawal = await prisma.transaction.findFirst({
            where: {
              OR: [
                { providerTransactionId: eventData.id?.toString() },
                {
                  metadata: {
                    path: ['flwReference'],
                    equals: eventData.reference,
                  },
                },
              ],
              type: 'PAYOUT',
              metadata: { path: ['withdrawal'], equals: true },
            },
            include: { task: true },
          });

          if (withdrawal) {
            await prisma.transaction.update({
              where: { id: withdrawal.id },
              data: {
                status: 'COMPLETED',
                providerTransactionId: eventData.id?.toString(),
                metadata: {
                  ...(withdrawal.metadata as any),
                  webhookData: eventData,
                  completedAt: new Date().toISOString(),
                },
              },
            });

            const steward = withdrawal.task?.stewardId
              ? await prisma.user.findUnique({
                  where: { id: withdrawal.task.stewardId },
                })
              : null;
            if (steward) {
              await notifyWithdrawalCompleted(
                steward.id,
                withdrawal.amount
              ).catch(console.error);
            }
          }
        }
        break;
      }

      case 'transfer.failed':
      case 'transfer.reversed': {
        if (eventData?.reference || eventData?.id) {
          const withdrawal = await prisma.transaction.findFirst({
            where: {
              OR: [
                { providerTransactionId: eventData.id?.toString() },
                {
                  metadata: {
                    path: ['flwReference'],
                    equals: eventData.reference,
                  },
                },
              ],
              type: 'PAYOUT',
              metadata: { path: ['withdrawal'], equals: true },
            },
            include: { task: true },
          });

          if (withdrawal && withdrawal.status !== 'FAILED') {
            await prisma.transaction.update({
              where: { id: withdrawal.id },
              data: {
                status: 'FAILED',
                metadata: {
                  ...(withdrawal.metadata as any),
                  webhookData: eventData,
                  failureReason:
                    eventData.complete_message || eventData.narration,
                  failedAt: new Date().toISOString(),
                },
              },
            });

            const steward = withdrawal.task?.stewardId
              ? await prisma.user.findUnique({
                  where: { id: withdrawal.task.stewardId },
                })
              : null;
            if (steward) {
              const failureReason =
                eventData.complete_message ||
                eventData.narration ||
                'Unknown error';
              await notifyWithdrawalFailed(
                steward.id,
                withdrawal.amount,
                failureReason
              ).catch(console.error);
            }
          }
        }
        break;
      }

      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for webhooks.' },
    { status: 405 }
  );
}
