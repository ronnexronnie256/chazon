import { prisma } from "@/lib/prisma";

export interface WalletBalance {
  availableBalance: number;
  pendingBalance: number;
  frozenBalance: number;
  totalEarnings: number;
  currency: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  totalTransactions: number;
  completedTasks: number;
  currency: string;
}

/**
 * Calculate wallet balance for a steward
 * Available: Completed PAYOUT transactions (not frozen)
 * Pending: Payout transactions that are PENDING
 * Frozen: Payout transactions for disputed tasks
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
  // Get all PAYOUT transactions for this steward's tasks
  const stewardTasks = await prisma.task.findMany({
    where: { stewardId: userId },
    select: { id: true },
  });

  const taskIds = stewardTasks.map((t) => t.id);

  if (taskIds.length === 0) {
    return {
      availableBalance: 0,
      pendingBalance: 0,
      frozenBalance: 0,
      totalEarnings: 0,
      currency: "UGX",
    };
  }

  // Get all PAYOUT transactions (including withdrawals)
  const payouts = await prisma.transaction.findMany({
    where: {
      OR: [
        { taskId: { in: taskIds } },
        {
          task: {
            stewardId: userId,
            category: "SYSTEM_WITHDRAWAL",
          },
        },
      ],
      type: "PAYOUT",
    },
    include: {
      task: {
        include: {
          dispute: true,
        },
      },
    },
  });

  // Check for disputed tasks that should freeze payouts
  const disputedTaskIds = new Set(
    (
      await prisma.dispute.findMany({
        where: {
          taskId: { in: taskIds },
          status: { in: ["OPEN", "UNDER_REVIEW"] },
        },
        select: { taskId: true },
      })
    ).map((d) => d.taskId)
  );

  let availableBalance = 0;
  let pendingBalance = 0;
  let frozenBalance = 0;
  let totalEarnings = 0;

  for (const payout of payouts) {
    const amount = payout.amount;
    
    // Check if this is a withdrawal (negative amount) or earnings (positive amount)
    const isWithdrawal = amount < 0;
    
    if (isWithdrawal) {
      // Withdrawals reduce available balance
      if (payout.status === "COMPLETED") {
        availableBalance += amount; // amount is negative, so this subtracts
      } else if (payout.status === "PENDING") {
        pendingBalance += amount; // amount is negative, so this subtracts
      }
    } else {
      // Earnings increase balance
      totalEarnings += amount;

      // Check if task is disputed
      const isDisputed = disputedTaskIds.has(payout.taskId);

      if (isDisputed) {
        // Freeze payouts for disputed tasks (FR-22)
        frozenBalance += amount;
      } else if (payout.status === "COMPLETED") {
        availableBalance += amount;
      } else if (payout.status === "PENDING") {
        pendingBalance += amount;
      }
    }
  }

  // Get currency from first task (assuming all tasks use same currency)
  const firstTask = await prisma.task.findFirst({
    where: { stewardId: userId },
    select: { currency: true },
  });

  return {
    availableBalance,
    pendingBalance,
    frozenBalance,
    totalEarnings,
    currency: firstTask?.currency || "UGX",
  };
}

/**
 * Get earnings summary for a steward
 */
export async function getEarningsSummary(userId: string): Promise<EarningsSummary> {
  const stewardTasks = await prisma.task.findMany({
    where: { stewardId: userId },
    select: { id: true, currency: true },
  });

  const taskIds = stewardTasks.map((t) => t.id);

  if (taskIds.length === 0) {
    return {
      totalEarnings: 0,
      thisMonth: 0,
      lastMonth: 0,
      totalTransactions: 0,
      completedTasks: 0,
      currency: "UGX",
    };
  }

  // Get all completed PAYOUT transactions (including withdrawals which are negative)
  const payouts = await prisma.transaction.findMany({
    where: {
      taskId: { in: taskIds },
      type: "PAYOUT",
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
  });
  
  // Also get withdrawals from system tasks
  const systemWithdrawals = await prisma.transaction.findMany({
    where: {
      task: {
        stewardId: userId,
        category: "SYSTEM_WITHDRAWAL",
      },
      type: "PAYOUT",
      status: "COMPLETED",
    },
  });
  
  // Combine all payouts including withdrawals
  const allPayouts = [...payouts, ...systemWithdrawals];

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  let totalEarnings = 0;
  let thisMonth = 0;
  let lastMonth = 0;

  for (const payout of payouts) {
    const amount = payout.amount;
    // Only count positive amounts (earnings) for earnings summary, not withdrawals
    if (amount > 0) {
      totalEarnings += amount;

      const createdAt = new Date(payout.createdAt);
      if (createdAt >= thisMonthStart) {
        thisMonth += amount;
      } else if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) {
        lastMonth += amount;
      }
    }
  }

  // Get completed tasks count
  const completedTasks = await prisma.task.count({
    where: {
      stewardId: userId,
      status: "DONE",
    },
  });

  const currency = stewardTasks[0]?.currency || "UGX";

  return {
    totalEarnings,
    thisMonth,
    lastMonth,
    totalTransactions: payouts.length,
    completedTasks,
    currency,
  };
}

/**
 * Get transaction history for a steward
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  const stewardTasks = await prisma.task.findMany({
    where: { stewardId: userId },
    select: { id: true },
  });

  const taskIds = stewardTasks.map((t) => t.id);

  if (taskIds.length === 0) {
    return {
      transactions: [],
      total: 0,
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        OR: [
          { taskId: { in: taskIds } },
          {
            task: {
              stewardId: userId,
              category: "SYSTEM_WITHDRAWAL",
            },
          },
        ],
        type: { in: ["PAYOUT", "REFUND", "TIP"] },
      },
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
    prisma.transaction.count({
      where: {
        OR: [
          { taskId: { in: taskIds } },
          {
            task: {
              stewardId: userId,
              category: "SYSTEM_WITHDRAWAL",
            },
          },
        ],
        type: { in: ["PAYOUT", "REFUND", "TIP"] },
      },
    }),
  ]);

  return {
    transactions,
    total,
  };
}

