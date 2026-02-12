import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/clerk/auth'
import { prisma } from '@/lib/prisma'

// Helper function to convert data to CSV
function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = []
  
  // Add headers
  csvRows.push(headers.join(','))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || ''
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

export async function GET(req: Request) {
  try {
    await requireRole('ADMIN')

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // users, tasks, transactions, disputes, payouts

    let csvData = ''
    let filename = 'export.csv'
    let headers: string[] = []

    switch (type) {
      case 'users': {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            city: true,
            isIdentityVerified: true,
            createdAt: true,
            stewardProfile: {
              select: {
                rating: true,
                completedTasks: true,
                backgroundCheckStatus: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })

        headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'City', 'Verified', 'Rating', 'Completed Tasks', 'Status', 'Created At']
        const csvRows = users.map(user => ({
          'ID': user.id,
          'Name': user.name,
          'Email': user.email,
          'Phone': user.phone || '',
          'Role': user.role,
          'City': user.city || '',
          'Verified': user.isIdentityVerified ? 'Yes' : 'No',
          'Rating': user.stewardProfile?.rating?.toFixed(2) || '',
          'Completed Tasks': user.stewardProfile?.completedTasks || '',
          'Status': user.stewardProfile?.backgroundCheckStatus || '',
          'Created At': user.createdAt.toISOString()
        }))
        csvData = convertToCSV(csvRows, headers)
        filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`
        break
      }

      case 'tasks': {
        const tasks = await prisma.task.findMany({
          include: {
            client: { select: { name: true, email: true } },
            steward: { select: { name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        })

        headers = ['ID', 'Status', 'Category', 'Client', 'Client Email', 'Steward', 'Steward Email', 'Price', 'Currency', 'Scheduled Start', 'Scheduled End', 'Created At']
        const csvRows = tasks.map(task => ({
          'ID': task.id,
          'Status': task.status,
          'Category': task.category,
          'Client': task.client.name,
          'Client Email': task.client.email,
          'Steward': task.steward?.name || 'Unassigned',
          'Steward Email': task.steward?.email || 'N/A',
          'Price': task.agreedPrice,
          'Currency': task.currency,
          'Scheduled Start': task.scheduledStart.toISOString(),
          'Scheduled End': task.scheduledEnd?.toISOString() || '',
          'Created At': task.createdAt.toISOString()
        }))
        csvData = convertToCSV(csvRows, headers)
        filename = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`
        break
      }

      case 'transactions': {
        const transactions = await prisma.transaction.findMany({
          include: {
            task: {
              include: {
                client: { select: { name: true, email: true } },
                steward: { select: { name: true, email: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })

        headers = ['ID', 'Type', 'Status', 'Amount', 'Platform Fee', 'Payment Method', 'Client', 'Steward', 'Task ID', 'Created At']
        const csvRows = transactions.map(tx => ({
          'ID': tx.id,
          'Type': tx.type,
          'Status': tx.status,
          'Amount': tx.amount,
          'Platform Fee': tx.platformFee,
          'Payment Method': tx.paymentMethod || '',
          'Client': tx.task.client.name,
          'Steward': tx.task.steward?.name || 'Unassigned',
          'Task ID': tx.taskId,
          'Created At': tx.createdAt.toISOString()
        }))
        csvData = convertToCSV(csvRows, headers)
        filename = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`
        break
      }

      case 'disputes': {
        const disputes = await prisma.dispute.findMany({
          include: {
            task: {
              include: {
                client: { select: { name: true, email: true } },
                steward: { select: { name: true, email: true } }
              }
            },
            opener: { select: { name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        })

        headers = ['ID', 'Status', 'Reason', 'Opener', 'Opener Email', 'Client', 'Client Email', 'Steward', 'Steward Email', 'Task ID', 'Resolution', 'Created At', 'Updated At']
        const csvRows = disputes.map(dispute => ({
          'ID': dispute.id,
          'Status': dispute.status,
          'Reason': dispute.reason,
          'Opener': dispute.opener.name,
          'Opener Email': dispute.opener.email,
          'Client': dispute.task.client.name,
          'Client Email': dispute.task.client.email,
          'Steward': dispute.task.steward?.name || 'Unassigned',
          'Steward Email': dispute.task.steward?.email || 'N/A',
          'Task ID': dispute.taskId,
          'Resolution': dispute.resolution || '',
          'Created At': dispute.createdAt.toISOString(),
          'Updated At': dispute.updatedAt.toISOString()
        }))
        csvData = convertToCSV(csvRows, headers)
        filename = `disputes_export_${new Date().toISOString().split('T')[0]}.csv`
        break
      }

      case 'payouts': {
        const payouts = await prisma.transaction.findMany({
          where: { type: 'PAYOUT' },
          include: {
            task: {
              include: {
                steward: { select: { name: true, email: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })

        headers = ['ID', 'Status', 'Amount', 'Steward', 'Steward Email', 'Task ID', 'Payment Method', 'Provider Transaction ID', 'Created At']
        const csvRows = payouts.map(payout => ({
          'ID': payout.id,
          'Status': payout.status,
          'Amount': payout.amount,
          'Steward': payout.task.steward?.name || 'Unassigned',
          'Steward Email': payout.task.steward?.email || 'N/A',
          'Task ID': payout.taskId,
          'Payment Method': payout.paymentMethod || '',
          'Provider Transaction ID': payout.providerTransactionId || '',
          'Created At': payout.createdAt.toISOString()
        }))
        csvData = convertToCSV(csvRows, headers)
        filename = `payouts_export_${new Date().toISOString().split('T')[0]}.csv`
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid export type' },
          { status: 400 }
        )
    }

    // Return CSV file
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
