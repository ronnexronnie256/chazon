
export const STEP_UP_INTENT_KEY = 'chazon_step_up_intent'
export const STEP_UP_EVENT = 'auth:step-up-required'

/**
 * Step-Up Authentication Flow
 * 
 * 1. Client initiates a high-risk action (e.g. wallet withdrawal).
 * 2. API returns 403/401 with code "STEP_UP_REQUIRED".
 * 3. ApiClient intercepts this response and dispatches 'auth:step-up-required' event.
 * 4. StepUpProvider listens to event, pauses the UI, and shows StepUpModal.
 * 5. User clicks "Continue with Google".
 * 6. Intent (endpoint + options) is saved to localStorage.
 * 7. User is redirected to Google OAuth.
 * 8. Upon return, StepUpProvider detects saved intent.
 * 9. Provider automatically retries the original API request.
 * 10. If successful, success toast is shown.
 */

export interface StepUpIntent {
  endpoint: string
  options?: RequestInit
  timestamp: number
  actionKey?: string
  retryPayload?: {
    method: string
    url: string
    body?: any
  }
}

export function saveStepUpIntent(endpoint: string, options?: RequestInit, actionKey?: string, retryPayload?: { method: string; url: string; body?: any }) {
  if (typeof window === 'undefined') return
  const intent: StepUpIntent = {
    endpoint,
    options,
    timestamp: Date.now(),
    actionKey,
    retryPayload,
  }
  localStorage.setItem(STEP_UP_INTENT_KEY, JSON.stringify(intent))
}

export function loadStepUpIntent(): StepUpIntent | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STEP_UP_INTENT_KEY)
  if (!stored) return null
  
  try {
    const intent = JSON.parse(stored) as StepUpIntent
    // Optional: expire intent after 5 minutes
    if (Date.now() - intent.timestamp > 5 * 60 * 1000) {
      clearStepUpIntent()
      return null
    }
    return intent
  } catch {
    return null
  }
}

export function clearStepUpIntent() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STEP_UP_INTENT_KEY)
}
