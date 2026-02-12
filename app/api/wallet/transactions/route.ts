import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only stewards have wallets
    if (user.role !== "STEWARD") {
      return NextResponse.json(
        { error: "Only stewards can access transaction history" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Filter parameters
    const status = searchParams.get("status"); // PENDING, COMPLETED, FAILED
    const type = searchParams.get("type"); // PAYOUT, TIP, REFUND
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const isWithdrawal = searchParams.get("isWithdrawal"); // true/false

    // Get steward tasks
    const stewardTasks = await prisma.task.findMany({
      where: { stewardId: user.id },
      select: { id: true },
    });

    const taskIds = stewardTasks.map((t) => t.id);

    if (taskIds.length === 0) {
      return NextResponse.json({
        transactions: [],
        total: 0,
      });
    }

    // Build where clause
    const where: any = {
      OR: [
        { taskId: { in: taskIds } },
        {
          task: {
            stewardId: user.id,
            category: "SYSTEM_WITHDRAWAL",
          },
        },
      ],
      type: { in: ["PAYOUT", "REFUND", "TIP"] },
    };

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount);
      }
    }

    if (isWithdrawal === "true") {
      where.amount = { ...where.amount, lt: 0 }; // Withdrawals are negative
      where.metadata = {
        path: ["withdrawal"],
        equals: true,
      };
    } else if (isWithdrawal === "false") {
      where.amount = { ...where.amount, gt: 0 }; // Earnings are positive
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          task: {
            select: {
              id: true,
              category: true,
              description: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Transaction history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 }
    );
  }
}

