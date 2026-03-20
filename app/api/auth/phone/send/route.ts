import { NextRequest, NextResponse } from 'next/server';
import {
  sms,
  formatPhoneNumber,
  isValidUgandaPhone,
} from '@/lib/africastalking';
import { generateOTP, storeOTP } from '@/lib/otp';

const TEST_MODE = process.env.SMS_TEST_MODE === 'true';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number required' },
        { status: 400 }
      );
    }

    console.log('[Send OTP] Phone:', phone);

    if (!isValidUgandaPhone(phone)) {
      return NextResponse.json(
        {
          error:
            'Invalid phone number. Please enter a valid Uganda number (e.g., 0771234567)',
        },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    console.log('[Send OTP] Formatted phone:', formattedPhone);

    const otp = generateOTP();
    console.log('[Send OTP] Generated OTP:', otp);

    // TEST MODE: Log OTP to console instead of sending SMS
    if (TEST_MODE) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 TEST MODE - OTP for', formattedPhone, ':', otp);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      storeOTP(phone, otp);

      return NextResponse.json({
        success: true,
        message: 'Verification code generated (TEST MODE)',
        expiresIn: 600,
        testOtp: otp, // Include OTP in response for testing
      });
    }

    if (!sms) {
      console.error("[Send OTP] Africa's Talking SMS not configured");
      return NextResponse.json(
        {
          error: 'SMS service not configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    try {
      const result = await sms.send({
        to: [formattedPhone],
        message: `Your Chazon verification code is: ${otp}. This code expires in 10 minutes.`,
      });

      console.log('[Send OTP] SMS result:', JSON.stringify(result));

      if (result.SMSMessageData?.Recipients?.[0]?.status === 'success') {
        storeOTP(phone, otp);

        return NextResponse.json({
          success: true,
          message: 'Verification code sent to your phone',
          expiresIn: 600,
        });
      } else {
        console.error('[Send OTP] SMS send failed:', result);
        return NextResponse.json(
          {
            error: 'Failed to send SMS. Please try again.',
          },
          { status: 500 }
        );
      }
    } catch (smsError: any) {
      console.error('[Send OTP] SMS error:', smsError);

      if (smsError.message?.includes('Invalid Phone Numbers')) {
        return NextResponse.json(
          {
            error: 'Invalid phone number format',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to send SMS. Please try again.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Send OTP] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

import { createClient } from '@/lib/supabase/server';
