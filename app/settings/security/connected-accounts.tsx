'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

async function logSecurityEvent(
  type: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH',
  metadata?: Record<string, any>
) {
  try {
    await fetch('/api/security-events/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, severity, metadata }),
    });
  } catch (e) {
    // non-blocking
  }
}

export function ConnectedAccounts() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);

      const provider = user?.app_metadata?.provider;
      setGoogleConnected(provider === 'google');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const provider = session.user.app_metadata?.provider;
        setGoogleConnected(provider === 'google');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const flag =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('linking-google')
        : null;
    if (!flag) return;

    if (googleConnected) {
      toast.success('Google account linked');
      logSecurityEvent('AUTH_PROVIDER_LINKED', 'MEDIUM', {
        provider: 'google',
      });
    } else {
      toast.error(
        'This Google account is already linked to another Chazon account.'
      );
    }
    try {
      window.localStorage.removeItem('linking-google');
    } catch {}
  }, [googleConnected]);

  const handleConnectGoogle = async () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('linking-google', '1');
      }
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: '/settings/security',
        },
      });
    } catch (e: any) {
      toast.error('Failed to start Google linking');
      try {
        window.localStorage.removeItem('linking-google');
      } catch {}
    }
  };

  const handleUpdatePassword = async () => {
    if (!user || !user.email) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setUpdatingPassword(true);
    try {
      const supabase = createClient();

      const verifyResult = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyResult.error) {
        toast.error('Current password is incorrect');
        setUpdatingPassword(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message || 'Failed to update password');
      } else {
        toast.success('Password updated');
        logSecurityEvent('PASSWORD_UPDATED', 'MEDIUM');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Manage your login methods.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Google</p>
              <p className="text-sm text-gray-500">
                {googleConnected ? 'Connected' : 'Not connected'}
              </p>
            </div>
            {!googleConnected && (
              <Button onClick={handleConnectGoogle} variant="outline">
                Connect Google
              </Button>
            )}
          </div>

          <div className="border-t my-2" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-gray-500">
                  {user?.password_enabled ? 'Set' : 'Not set'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button
                onClick={handleUpdatePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? 'Updating...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
