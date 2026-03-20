import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyOTP } from '@/lib/otp';
import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone and code are required' },
        { status: 400 }
      );
    }

    const result = verifyOTP(phone, code);

    if (!result.valid) {
      await logSecurityEvent({
        type: 'PHONE_VERIFY_FAILED',
        severity: 'LOW',
        userId: user.id,
        details: { phone, reason: result.reason },
      });

      return NextResponse.json(
        {
          success: false,
          error: result.reason,
        },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone,
        phoneVerified: new Date(),
      },
    });

    await logSecurityEvent({
      type: 'PHONE_VERIFIED',
      severity: 'LOW',
      userId: user.id,
      details: { phone },
    });

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
      trustLevel: 'HIGH',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
