import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/supabase/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"
import { 
  Users, 
  Briefcase, 
  AlertTriangle, 
  DollarSign, 
  ShieldAlert,
  Clock
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  // 1. Restrict access
  await requireRole("ADMIN")

  // 2. Fetch Summary Metrics (Parallel)
  const [
    totalUsers,
    stewardStats,
    activeBookings,
    escrowHeld,
    openDisputes,
    latestBookings,
    latestTransactions,
    latestSecurityEvents
  ] = await Promise.all([
    prisma.user.count(),
    prisma.stewardProfile.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.task.count({
      where: { status: "IN_PROGRESS" }
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { 
        type: "CHARGE", 
        status: "HELD" 
      }
    }),
    prisma.dispute.count({
      where: { status: "OPEN" }
    }),
    // Recent Tables
    prisma.task.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, email: true } },
        steward: { select: { name: true, email: true } }
      }
    }),
    prisma.transaction.findMany({
      take: 5,
      where: {
        OR: [
          { status: "HELD" },
          { status: "RELEASED" },
          { status: "REFUNDED" },
          { status: "DISPUTED" },
          { type: "REFUND" }
        ]
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.securityEvent.findMany({
      take: 5,
      orderBy: { createdAt: "desc" }
    })
  ])

  // Process steward stats
  const stewardCounts = stewardStats.reduce((acc, curr) => {
    acc[curr.status] = curr._count
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="text-sm text-gray-500">
            Server-side rendered • {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
          </div>

          {/* Active Bookings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Active Bookings</h3>
              <Briefcase className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeBookings}</p>
          </div>

          {/* Escrow Held */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Escrow Held</h3>
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              UGX {(escrowHeld._sum.amount || 0).toLocaleString()}
            </p>
          </div>

          {/* Open Disputes */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Open Disputes</h3>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{openDisputes}</p>
          </div>
        </div>

        {/* Steward Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Steward Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stewardCounts).map(([status, count]) => (
              <div key={status} className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase">{status}</span>
                <span className="text-xl font-bold text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(stewardCounts).length === 0 && (
              <p className="text-gray-500 text-sm">No steward data available</p>
            )}
          </div>
        </div>

        {/* Recent Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Latest Bookings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Latest Bookings</h3>
              <Link href="/admin/tasks" className="text-sm text-blue-600 hover:text-blue-800">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">ID</th>
                    <th className="px-6 py-3 font-medium">Client</th>
                    <th className="px-6 py-3 font-medium">Steward</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {latestBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xs">{booking.id.slice(0, 8)}...</td>
                      <td className="px-6 py-3">{booking.client.name}</td>
                      <td className="px-6 py-3">{booking.steward?.name || 'Unassigned'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${booking.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 
                            booking.status === 'DONE' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {latestBookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No bookings found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latest Transactions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Latest Escrow Tx</h3>
              <Link href="/admin/payouts" className="text-sm text-blue-600 hover:text-blue-800">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {latestTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">{tx.type}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${tx.status === 'HELD' ? 'bg-purple-100 text-purple-800' : 
                            tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-mono">
                        {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {latestTransactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Events */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Security Events</h3>
              <ShieldAlert className="h-4 w-4 text-gray-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Details</th>
                    <th className="px-6 py-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {latestSecurityEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{event.type}</td>
                      <td className="px-6 py-3 text-gray-500 max-w-md truncate">
                        {JSON.stringify(event.details)}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-500 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.createdAt).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {latestSecurityEvents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No security events found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}