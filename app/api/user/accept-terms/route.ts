import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { version } = await request.json();

    if (!version) {
      return NextResponse.json(
        { error: 'Version is required' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('user')
      .update({
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: version,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user terms acceptance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update terms acceptance' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in accept-terms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
