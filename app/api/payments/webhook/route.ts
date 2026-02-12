import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, processWebhookEvent } from "@/lib/flutterwave";
import { prisma } from "@/lib/prisma";
import { $Enums } from "@prisma/client";
import {
  notifyPaymentReceived,
  notifyPaymentReleased,
  notifyWithdrawalCompleted,
  notifyWithdrawalFailed,
} from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    // Get the signature from headers
    const signature = req.headers.get("verif-hash");
    
    if (!signature) {
      return NextResponse.json(
        { error: "Missing verif-hash header" },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = await req.json();

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Process the webhook event
    const event = payload.event;
    const eventData = payload.data;

    console.log("Flutterwave webhook received:", { event, tx_ref: eventData?.tx_ref });

    // Handle different event types
    switch (event) {
      case "charge.completed":
      case "charge.successful": {
        // Verify the transaction
        const verification = await processWebhookEvent(payload);
        
        if (verification.status === "success" && eventData?.tx_ref) {
          // Update transaction in database
          const transaction = await prisma.transaction.findUnique({
            where: { id: eventData.tx_ref },
            include: { task: true },
          });

          if (transaction && transaction.status !== $Enums.TransactionStatus.HELD) {
            await prisma.transaction.update({
              where: { id: eventData.tx_ref },
              data: {
                status: $Enums.TransactionStatus.HELD,
                providerTransactionId: eventData.id?.toString() || eventData.flw_ref,
                paymentMethod: eventData.payment_type || eventData.charged_amount?.currency,
                metadata: eventData,
              },
            });

            // Notify user about payment received
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

      case "charge.failed": {
        if (eventData?.tx_ref) {
          await prisma.transaction.update({
            where: { id: eventData.tx_ref },
            data: {
              status: "FAILED",
              metadata: eventData,
            },
          });
        }
        break;
      }

      case "transfer.completed":
      case "transfer.successful": {
        // Handle withdrawal status updates
        if (eventData?.reference) {
          // Find withdrawal transaction by provider transaction ID or reference
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
              metadata: {
                path: ['withdrawal'],
                equals: true,
              },
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
            console.log('Withdrawal completed:', withdrawal.id);

            // Notify steward about successful withdrawal
            const steward = withdrawal.task?.stewardId
              ? await prisma.user.findUnique({ where: { id: withdrawal.task.stewardId } })
              : null;
            if (steward) {
              await notifyWithdrawalCompleted(steward.id, withdrawal.amount).catch(console.error);
            }
          }
        }
        break;
      }

      case "transfer.failed":
      case "transfer.reversed": {
        // Handle failed/reversed withdrawals
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
              metadata: {
                path: ['withdrawal'],
                equals: true,
              },
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
                  failureReason: eventData.complete_message || eventData.narration,
                  failedAt: new Date().toISOString(),
                },
              },
            });
            console.log('Withdrawal failed:', withdrawal.id);

            // Notify steward about failed withdrawal
            const steward = withdrawal.task?.stewardId
              ? await prisma.user.findUnique({ where: { id: withdrawal.task.stewardId } })
              : null;
            if (steward) {
              const failureReason = (eventData.complete_message || eventData.narration || "Unknown error") as string;
              await notifyWithdrawalFailed(steward.id, withdrawal.amount, failureReason).catch(console.error);
            }
          }
        }
        break;
      }

      default:
        console.log("Unhandled webhook event:", event);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Still return 200 to prevent Flutterwave from retrying
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 200 }
    );
  }
}

// Flutterwave webhooks only use POST
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for webhooks." },
    { status: 405 }
  );
}
