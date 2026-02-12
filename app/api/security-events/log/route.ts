 import { NextResponse } from 'next/server'
 import { prisma } from '@/lib/prisma'
 import { auth } from '@clerk/nextjs/server'
 
 export async function POST(req: Request) {
   try {
     const { userId } = await auth()
     if (!userId) {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
     }
 
     const body = await req.json()
     const { type, severity, metadata } = body as { type: string, severity: 'LOW' | 'MEDIUM' | 'HIGH', metadata?: Record<string, any> }
 
     if (!type || !severity) {
       return NextResponse.json({ success: false, error: 'Missing type or severity' }, { status: 400 })
     }
 
     await prisma.securityEvent.create({
       data: {
         type,
         severity,
         userId,
         details: metadata || {},
       }
     })
 
     return NextResponse.json({ success: true })
   } catch (error) {
     console.error('Security event log error:', error)
     return NextResponse.json(
       { success: false, error: 'Internal server error' },
       { status: 500 }
     )
   }
 }
 
