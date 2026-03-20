import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, severity, metadata } = body as {
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      metadata?: Record<string, any>;
    };

    if (!type || !severity) {
      return NextResponse.json(
        { success: false, error: 'Missing type or severity' },
        { status: 400 }
      );
    }

    await prisma.securityEvent.create({
      data: {
        type,
        severity,
        userId,
        details: metadata || {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Security event log error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
