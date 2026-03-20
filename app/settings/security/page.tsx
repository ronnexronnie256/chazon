import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConnectedAccounts } from './connected-accounts';
import { PhoneVerification } from '@/components/settings/phone-verification';

export default async function SecuritySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Security Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account security and connected accounts.
          </p>
        </div>

        <div className="border-t" />

        <PhoneVerification />
        <ConnectedAccounts />
      </div>
    </div>
  );
}
