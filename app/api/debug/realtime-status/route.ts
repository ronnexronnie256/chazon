import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/debug/realtime-status
 * Check if Supabase Realtime is properly configured
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    // Try to subscribe to a test channel to check if realtime works
    const testChannelName = `debug:${Date.now()}`;
    const channel = supabase.channel(testChannelName);

    let channelStatus = 'not_subscribed';
    let subscriptionError = null;

    channel.on('system', { event: 'connected' }, () => {
      channelStatus = 'connected';
    });

    channel.subscribe((status, err) => {
      channelStatus = status;
      if (err) {
        subscriptionError = err.message;
      }
    });

    // Wait a moment for the subscription to establish
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clean up
    channel.unsubscribe();

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      realtime: {
        status: channelStatus,
        error: subscriptionError,
        message:
          channelStatus === 'connected'
            ? 'Supabase Realtime is working correctly!'
            : 'Supabase Realtime may not be configured. Check Database > Replication in Supabase dashboard.',
      },
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? 'configured'
        : 'missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? 'configured'
        : 'missing',
      instructions:
        channelStatus !== 'connected'
          ? [
              '1. Go to your Supabase Dashboard',
              '2. Navigate to Database > Replication',
              '3. Find the chatmessage table',
              '4. Enable it for replication (toggle the switch)',
              '5. Save changes and wait a moment',
              '6. Refresh this page to verify',
            ]
          : [],
    });
  } catch (error) {
    console.error('Realtime status check error:', error);
    return NextResponse.json(
      {
        authenticated: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
