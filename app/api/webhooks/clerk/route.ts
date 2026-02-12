import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'
 
export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET || ''
  if (!secret) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 })
  }
  const headers = req.headers
  const svix_id = headers.get('svix-id') || ''
  const svix_timestamp = headers.get('svix-timestamp') || ''
  const svix_signature = headers.get('svix-signature') || ''
  const payload = await req.text()
  const wh = new Webhook(secret)
  let evt: any
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch {
    return new NextResponse('Invalid signature', { status: 400 })
  }
  const type = evt.type
  const data = evt.data
  if (type === 'user.created' || type === 'user.updated') {
    const email =
      data.email_addresses?.find((e: any) => e.id === data.primary_email_address_id)?.email_address ||
      data.email_addresses?.[0]?.email_address ||
      null
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ')
    await prisma.user.upsert({
      where: { id: data.id },
      update: {
        email: email || undefined,
        name: name || undefined,
        image: data.image_url || undefined,
      },
      create: {
        id: data.id,
        email: email || undefined,
        name: name || 'User',
        image: data.image_url || undefined,
        role: 'CLIENT',
      },
    })
  }
  return NextResponse.json({ ok: true })
}
