import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { getWalletBalance, getEarningsSummary } from "@/lib/wallet";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only stewards have wallets
    if (user.role !== "STEWARD") {
      return NextResponse.json(
        { error: "Only stewards can access wallet balance" },
        { status: 403 }
      );
    }

    const [balance, earnings] = await Promise.all([
      getWalletBalance(user.id),
      getEarningsSummary(user.id),
    ]);

    return NextResponse.json({
      balance,
      earnings,
    });
  } catch (error) {
    console.error("Wallet balance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet balance" },
      { status: 500 }
    );
  }
}

