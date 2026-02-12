import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: 'mock-id',
      name: 'John Mugisha',
      email: 'mock@example.com',
      phone: '+256-772-123456',
      address: 'Ntinda, Kampala',
    },
    redirect: '/settings'
  })
}
