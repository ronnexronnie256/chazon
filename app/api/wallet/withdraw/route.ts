import { NextResponse } from "next/server";
import { getUser, requireTrustLevel, StepUpError } from "@/lib/clerk/auth";
import { getWalletBalance } from "@/lib/wallet";
import { initiateTransfer } from "@/lib/flutterwave";
import { prisma } from "@/lib/prisma";

/**
 * Calculate withdrawal fee
 * Fee structure:
 * - Fixed fee: 500 UGX per withdrawal
 * - Percentage fee: 0.5% of withdrawal amount
 * - Maximum fee: 5,000 UGX
 */
export function calculateWithdrawalFee(amount: number): {
  fixedFee: number;
  percentageFee: number;
  totalFee: number;
  netAmount: number;
} {
  const FIXED_FEE = 500; // Fixed fee in UGX
  const PERCENTAGE_RATE = 0.005; // 0.5%
  const MAX_FEE = 5000; // Maximum fee in UGX

  const fixedFee = FIXED_FEE;
  const percentageFee = amount * PERCENTAGE_RATE;
  const totalFee = Math.min(fixedFee + percentageFee, MAX_FEE);
  const netAmount = amount - totalFee;

  return {
    fixedFee,
    percentageFee,
    totalFee: Math.round(totalFee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  };
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enforce Step-Up Authentication (High Trust Level required)
    try {
      await requireTrustLevel(user, 'HIGH', 'wallet_withdrawal');
    } catch (error) {
      if (error instanceof StepUpError) {
        return NextResponse.json(
          { 
            error: error.message, 
            code: error.code,
            requiresReauth: true,
            provider: "google"
          },
          { status: 403 }
        );
      }
      throw error;
    }

    // Only stewards can withdraw
    if (user.role !== "STEWARD") {
      return NextResponse.json(
        { error: "Only stewards can withdraw funds" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { amount, accountNumber, accountBank, beneficiaryName, narration } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount" },
        { status: 400 }
      );
    }

    if (!accountNumber || !accountBank) {
      return NextResponse.json(
        { error: "Account number and bank code are required" },
        { status: 400 }
      );
    }

    // Get wallet balance
    const balance = await getWalletBalance(user.id);

    // Minimum withdrawal amount (e.g., 10,000 UGX to cover fees)
    const MIN_WITHDRAWAL_AMOUNT = 10000; // Can be made configurable via env
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()} ${balance.currency}`,
          minimumAmount: MIN_WITHDRAWAL_AMOUNT,
        },
        { status: 400 }
      );
    }

    // Calculate withdrawal fee
    const feeCalculation = calculateWithdrawalFee(amount);
    
    // Check if net amount after fees is positive
    if (feeCalculation.netAmount <= 0) {
      return NextResponse.json(
        {
          error: "Withdrawal amount is too small after fees",
          fee: feeCalculation.totalFee,
          netAmount: feeCalculation.netAmount,
        },
        { status: 400 }
      );
    }

    // Check if user has enough available balance
    if (amount > balance.availableBalance) {
      return NextResponse.json(
        {
          error: "Insufficient balance",
          availableBalance: balance.availableBalance,
          currency: balance.currency,
        },
        { status: 400 }
      );
    }

    // Check for frozen balance (disputed tasks)
    if (balance.frozenBalance > 0) {
      return NextResponse.json(
        {
          error: "Some funds are frozen due to active disputes",
          frozenBalance: balance.frozenBalance,
          availableBalance: balance.availableBalance,
        },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `WDR-${Date.now()}-${user.id.slice(0, 8)}`;

    // Initiate Flutterwave transfer
    try {
      const transferResponse = await initiateTransfer({
        account_bank: accountBank, // Bank code (e.g., "MPS" for Mobile Money Uganda)
        account_number: accountNumber,
        amount: amount,
        narration: narration || `Withdrawal to ${accountNumber}`,
        currency: balance.currency,
        reference: reference,
        beneficiary_name: beneficiaryName || user.name,
      });

      if (transferResponse.status === "success" && transferResponse.data) {
        // Get or create a system task for withdrawals
        // This allows us to track withdrawals in the Transaction table
        let systemTask = await prisma.task.findFirst({
          where: {
            clientId: user.id,
            stewardId: user.id,
            category: "SYSTEM_WITHDRAWAL",
          },
        });

        if (!systemTask) {
          // Create system task for withdrawals
          systemTask = await prisma.task.create({
            data: {
              clientId: user.id,
              stewardId: user.id,
              category: "SYSTEM_WITHDRAWAL",
              description: "System task for tracking withdrawals",
              address: "N/A",
              agreedPrice: 0,
              currency: balance.currency,
              pricingType: "FLAT",
              scheduledStart: new Date(),
              status: "DONE",
            },
          });
        }

        // Create withdrawal transaction record
        const withdrawalRecord = await prisma.transaction.create({
          data: {
            taskId: systemTask.id,
            amount: -amount, // Negative to represent withdrawal
            platformFee: feeCalculation.totalFee, // Store withdrawal fee
            type: "PAYOUT", // Reusing PAYOUT type for withdrawals
            status:
              transferResponse.data.status === "SUCCESSFUL"
                ? "COMPLETED"
                : "PENDING",
            providerTransactionId: transferResponse.data.id?.toString(),
            paymentMethod: "mobile_money",
            metadata: {
              withdrawal: true,
              accountNumber,
              accountBank,
              beneficiaryName: beneficiaryName || user.name,
              flwReference: reference,
              flwResponse: transferResponse.data,
              feeCalculation: {
                fixedFee: feeCalculation.fixedFee,
                percentageFee: feeCalculation.percentageFee,
                totalFee: feeCalculation.totalFee,
                netAmount: feeCalculation.netAmount,
              },
            },
          },
        });

        return NextResponse.json({
          success: true,
          message: "Withdrawal initiated successfully",
          data: {
            withdrawalId: withdrawalRecord.id,
            amount,
            fee: feeCalculation.totalFee,
            netAmount: feeCalculation.netAmount,
            currency: balance.currency,
            status: withdrawalRecord.status,
            reference,
            flwTransferId: transferResponse.data.id,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: "Failed to initiate withdrawal",
            message: transferResponse.message || "Unknown error",
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error("Flutterwave transfer error:", error);
      return NextResponse.json(
        {
          error: "Failed to process withdrawal",
          message: error.message || "Transfer initiation failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
