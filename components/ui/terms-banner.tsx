'use client';

import { useState } from 'react';
import { X, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { toast } from 'react-hot-toast';

const CURRENT_TERMS_VERSION = '1.0';

export function TermsBanner() {
  const { user, refreshUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const needsToAcceptTerms =
    !user?.termsAcceptedAt || user.termsVersion !== CURRENT_TERMS_VERSION;

  const handleAcceptTerms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/accept-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: CURRENT_TERMS_VERSION }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept terms');
      }

      toast.success('Thank you for accepting our Terms of Service');
      await refreshUser();
    } catch (error) {
      toast.error('Failed to save your acceptance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemindLater = () => {
    const nextReminder = new Date();
    nextReminder.setDate(nextReminder.getDate() + 1); // Remind again in 1 day
    localStorage.setItem(
      'termsBannerDismissedUntil',
      nextReminder.toISOString()
    );
    setIsDismissed(true);
  };

  if (!needsToAcceptTerms || isDismissed) {
    return null;
  }

  const dismissedUntil = localStorage.getItem('termsBannerDismissedUntil');
  if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-blue-900">
                <strong>Important:</strong> We&apos;ve updated our Terms of
                Service and Privacy Policy. Please review and accept to continue
                using Chazon.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRemindLater}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Remind me later
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptTerms}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                'Accepting...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Review & Accept
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
