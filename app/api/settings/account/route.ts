import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Account settings updated successfully',
    user: {
      id: 'mock-id',
      emailNotifications: true,
      marketingEmails: false,
    },
    redirect: '/settings'
  })
}
