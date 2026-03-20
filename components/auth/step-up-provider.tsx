'use client';

import { useEffect, useState } from 'react';
import { StepUpModal } from './step-up-modal';
import {
  STEP_UP_EVENT,
  loadStepUpIntent,
  clearStepUpIntent,
  StepUpIntent,
} from '@/lib/auth/step-up';
import { ApiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export function StepUpProvider() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<StepUpIntent | null>(
    null
  );
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const handleStepUpRequired = (event: Event) => {
      const customEvent = event as CustomEvent<{
        endpoint: string;
        options?: RequestInit;
        actionKey?: string;
        retryPayload?: { method: string; url: string; body?: any };
      }>;
      setPendingRequest({
        endpoint: customEvent.detail.endpoint,
        options: customEvent.detail.options,
        actionKey: customEvent.detail.actionKey,
        retryPayload: customEvent.detail.retryPayload,
        timestamp: Date.now(),
      });
      setIsOpen(true);
      setIsVerified(false);
    };

    window.addEventListener(STEP_UP_EVENT, handleStepUpRequired);
    return () => {
      window.removeEventListener(STEP_UP_EVENT, handleStepUpRequired);
    };
  }, []);

  useEffect(() => {
    const resumeAction = async () => {
      const intent = loadStepUpIntent();
      if (!intent) return;

      clearStepUpIntent();

      const toastId = toast.loading('Resuming action...');

      try {
        const resumeOptions = {
          ...(intent.options || {}),
          headers: {
            ...(intent.options?.headers || {}),
            'x-step-up-resume': 'true',
          },
        } as RequestInit;
        const response = await ApiClient.fetchRaw(
          intent.endpoint,
          resumeOptions
        );
        if (response.code === 'STEP_UP_REQUIRED') {
          toast.error('Verification failed, please try again.', {
            id: toastId,
          });
          return;
        }
        toast.success('Action completed successfully', { id: toastId });
      } catch (error) {
        console.error('Failed to resume action:', error);
        toast.error('Failed to complete action after re-authentication', {
          id: toastId,
        });
      }
    };

    resumeAction();
  }, []);

  useEffect(() => {
    if (isVerified && pendingRequest) {
      const retryAction = async () => {
        const toastId = toast.loading('Retrying action...');

        try {
          const response = await ApiClient.fetchRaw(
            pendingRequest.endpoint,
            pendingRequest.options
          );
          if (response.code === 'STEP_UP_REQUIRED') {
            toast.error('Verification not recognized. Please try again.', {
              id: toastId,
            });
            return;
          }
          toast.success('Action completed successfully', { id: toastId });
        } catch (error) {
          console.error('Failed to retry action:', error);
          toast.error('Failed to complete action', { id: toastId });
        }
      };

      retryAction();
    }
  }, [isVerified, pendingRequest]);

  const handleCancel = () => {
    setIsOpen(false);
    setPendingRequest(null);
    setIsVerified(false);
  };

  const handleVerified = () => {
    setIsVerified(true);
  };

  return (
    <StepUpModal
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleCancel();
      }}
      pendingRequest={pendingRequest}
      onCancel={handleCancel}
      onVerified={handleVerified}
    />
  );
}
