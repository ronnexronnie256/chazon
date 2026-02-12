"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth";
import { redirect, useRouter } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  Clock,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Calendar,
  Filter,
  X,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

interface WalletBalance {
  availableBalance: number;
  pendingBalance: number;
  frozenBalance: number;
  totalEarnings: number;
  currency: string;
}

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  totalTransactions: number;
  completedTasks: number;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  metadata?: any;
  task: {
    id: string;
    category: string;
    description: string | null;
    client: {
      name: string;
      email: string;
    };
  };
}

export default function WalletPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [isWithdrawalFilter, setIsWithdrawalFilter] = useState<string>("all");

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountBank, setAccountBank] = useState("MPS"); // Default to Mobile Money
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [narration, setNarration] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user) {
      redirect("/auth/signin");
    }

    if (user.role !== "STEWARD") {
      redirect("/dashboard");
    }

    fetchWalletData();
  }, [isAuthenticated, user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const balanceRes = await fetch("/api/wallet/balance");

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance);
        setEarnings(balanceData.earnings);
      }

      await fetchTransactions();
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      params.append("limit", "50");
      
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (minAmount) params.append("minAmount", minAmount);
      if (maxAmount) params.append("maxAmount", maxAmount);
      if (isWithdrawalFilter !== "all") params.append("isWithdrawal", isWithdrawalFilter);

      const transactionsRes = await fetch(`/api/wallet/transactions?${params.toString()}`);
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "STEWARD") {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, dateFrom, dateTo, minAmount, maxAmount, isWithdrawalFilter]);

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setMinAmount("");
    setMaxAmount("");
    setIsWithdrawalFilter("all");
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!balance) return;

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > balance.availableBalance) {
      toast.error("Invalid withdrawal amount");
      return;
    }

    if (!accountNumber || !accountBank) {
      toast.error("Please provide account details");
      return;
    }

    try {
      setWithdrawing(true);
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          accountNumber,
          accountBank,
          beneficiaryName: beneficiaryName || user?.name,
          narration: narration || `Withdrawal to ${accountNumber}`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Withdrawal initiated successfully");
        setShowWithdrawForm(false);
        setWithdrawAmount("");
        setAccountNumber("");
        setBeneficiaryName("");
        setNarration("");
        // Refresh wallet data
        fetchWalletData();
      } else {
        if (response.status === 403 && data.code === 'STEP_UP_REQUIRED') {
            toast.error("Additional verification required");
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/auth/step-up?returnUrl=${returnUrl}`);
            return;
        }
        toast.error(data.error || "Failed to initiate withdrawal");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to process withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "UGX") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateFee = (amount: number): number => {
    const FIXED_FEE = 500;
    const PERCENTAGE_RATE = 0.005;
    const MAX_FEE = 5000;
    return Math.min(FIXED_FEE + amount * PERCENTAGE_RATE, MAX_FEE);
  };

  if (!isAuthenticated || user?.role !== "STEWARD") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Wallet & Earnings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your earnings and withdraw funds to your Mobile Money account
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading wallet data...</p>
            </div>
          ) : (
            <>
              {/* Balance Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Wallet className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Available Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {balance
                          ? formatCurrency(balance.availableBalance, balance.currency)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {balance
                          ? formatCurrency(balance.pendingBalance, balance.currency)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Lock className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Frozen</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {balance
                          ? formatCurrency(balance.frozenBalance, balance.currency)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {balance
                          ? formatCurrency(balance.totalEarnings, balance.currency)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Earnings Summary */}
              {earnings && (
                <Card className="p-6 mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Earnings Summary</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">This Month</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(earnings.thisMonth, earnings.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Month</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(earnings.lastMonth, earnings.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Completed Tasks</p>
                      <p className="text-xl font-bold text-gray-900">{earnings.completedTasks}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Withdrawal Section */}
              <Card className="p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Withdraw Funds</h2>
                  <Button
                    onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                    variant="outline"
                  >
                    {showWithdrawForm ? "Cancel" : "Withdraw"}
                  </Button>
                </div>

                {showWithdrawForm && balance && (
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Withdrawal Fee Structure:</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Fixed fee: 500 {balance.currency}</li>
                            <li>Percentage fee: 0.5% of withdrawal amount</li>
                            <li>Maximum fee: 5,000 {balance.currency}</li>
                            <li>Minimum withdrawal: 10,000 {balance.currency}</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount ({balance.currency})
                      </label>
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="10000"
                        max={balance.availableBalance}
                        step="1000"
                        required
                      />
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">
                        Available: {formatCurrency(balance.availableBalance, balance.currency)}
                      </p>
                        {withdrawAmount && parseFloat(withdrawAmount) >= 10000 && (
                          <div className="text-xs">
                            <p className="text-gray-600">
                              Fee: {formatCurrency(calculateFee(parseFloat(withdrawAmount)), balance.currency)}
                            </p>
                            <p className="text-green-600 font-medium">
                              You'll receive: {formatCurrency(parseFloat(withdrawAmount) - calculateFee(parseFloat(withdrawAmount)), balance.currency)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Money Number
                      </label>
                      <Input
                        type="tel"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g., 256700000000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank/Provider Code
                      </label>
                      <select
                        value={accountBank}
                        onChange={(e) => setAccountBank(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="MPS">MTN Mobile Money (MPS)</option>
                        <option value="AIRTEL">Airtel Money</option>
                        <option value="UGX">Bank Transfer (UGX)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beneficiary Name (Optional)
                      </label>
                      <Input
                        type="text"
                        value={beneficiaryName}
                        onChange={(e) => setBeneficiaryName(e.target.value)}
                        placeholder={user?.name || "Your name"}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Narration (Optional)
                      </label>
                      <Input
                        type="text"
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        placeholder="Withdrawal description"
                      />
                    </div>

                    <Button type="submit" disabled={withdrawing} className="w-full" title="Requires Google verification">
                      <Lock className="w-4 h-4 mr-2" />
                      {withdrawing ? "Processing..." : "Initiate Withdrawal"}
                    </Button>
                  </form>
                )}
              </Card>

              {/* Transaction History */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="all">All Statuses</option>
                          <option value="PENDING">Pending</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="FAILED">Failed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="all">All Types</option>
                          <option value="PAYOUT">Payout</option>
                          <option value="TIP">Tip</option>
                          <option value="REFUND">Refund</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction</label>
                        <select
                          value={isWithdrawalFilter}
                          onChange={(e) => setIsWithdrawalFilter(e.target.value)}
                          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="all">All</option>
                          <option value="true">Withdrawals</option>
                          <option value="false">Earnings</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                        <Input
                          type="number"
                          value={minAmount}
                          onChange={(e) => setMinAmount(e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                        <Input
                          type="number"
                          value={maxAmount}
                          onChange={(e) => setMaxAmount(e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600 mb-4">
                  Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </div>
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Task
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(tx.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div>
                                <div className="font-medium">
                                  {tx.task.category === "SYSTEM_WITHDRAWAL" ? "Withdrawal" : tx.task.category}
                                </div>
                                {tx.task.category !== "SYSTEM_WITHDRAWAL" && (
                                  <div className="text-gray-500 text-xs">
                                    {tx.task.client.name}
                                  </div>
                                )}
                                {tx.task.category === "SYSTEM_WITHDRAWAL" && (tx.metadata as any)?.accountNumber && (
                                  <div className="text-gray-500 text-xs">
                                    To: {(tx.metadata as any).accountNumber}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div>
                                <div className={`font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {formatCurrency(Math.abs(tx.amount), balance?.currency || "UGX")}
                                </div>
                                {tx.amount < 0 && (tx.metadata as any)?.feeCalculation && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Fee: {formatCurrency((tx.metadata as any).feeCalculation.totalFee, balance?.currency || "UGX")}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  tx.status === "COMPLETED"
                                    ? "bg-green-100 text-green-800"
                                    : tx.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No transactions yet</p>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
