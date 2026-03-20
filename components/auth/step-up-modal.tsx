'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveStepUpIntent, StepUpIntent } from '@/lib/auth/step-up';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface StepUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingRequest: StepUpIntent | null;
  onCancel: () => void;
  onVerified: () => void;
}

export function StepUpModal({
  open,
  onOpenChange,
  pendingRequest,
  onCancel,
  onVerified,
}: StepUpModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');

  const handleVerify = async () => {
    if (!pendingRequest || !password) return;

    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user || !user.email) {
        toast.error('Unable to verify. Please sign in again.');
        setIsLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (signInError) {
        toast.error('Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      toast.success('Verification successful');
      setPassword('');
      onVerified();
      onOpenChange(false);
    } catch (error) {
      console.error('Step-up verification error:', error);
      toast.error('Verification failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password.length > 0) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Verify your identity</DialogTitle>
          <DialogDescription>
            To protect your account and funds, please enter your password to
            continue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="step-up-password">Password</Label>
            <Input
              id="step-up-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={isLoading || !password}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
