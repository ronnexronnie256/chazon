'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { saveStepUpIntent, StepUpIntent } from '@/lib/auth/step-up'
import { useSignIn } from '@clerk/nextjs'

interface StepUpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingRequest: StepUpIntent | null
  onCancel: () => void
}

export function StepUpModal({
  open,
  onOpenChange,
  pendingRequest,
  onCancel,
}: StepUpModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { isLoaded, signIn } = useSignIn()

  const handleContinue = async () => {
    if (!pendingRequest) return

    setIsLoading(true)
    
    try {
      // 1. Save intent
      saveStepUpIntent(
        pendingRequest.endpoint, 
        pendingRequest.options,
        pendingRequest.actionKey,
        pendingRequest.retryPayload
      )

      // 2. Start Clerk Google OAuth
      if (isLoaded && signIn) {
        await signIn.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: window.location.pathname,
          redirectUrlComplete: window.location.pathname,
        })
      } else {
        setIsLoading(false)
      }
      
      // If successful, the browser will redirect, so no need to set isLoading(false)
    } catch (error) {
      console.error('Step-up auth exception:', error)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Re-authenticate to continue</DialogTitle>
          <DialogDescription>
            To protect your account and funds, please verify with Google.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={isLoading}>
            {isLoading ? 'Redirecting...' : 'Continue with Google'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
