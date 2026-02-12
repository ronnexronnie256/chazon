import { Service, Category } from '@/types/service'
import { Booking } from '@/types/booking'
import { User } from '@/types/user'
import { STEP_UP_EVENT } from '@/lib/auth/step-up'

const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    return '/api'
  }
  const vercelUrl = process.env.VERCEL_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const base =
    appUrl ||
    (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000')
  return `${base}/api`
})()

export type ApiResponse<T> = {
  success: boolean
  data: T
  meta?: {
    pagination?: {
      page: number
      total: number
    }
  }
  error?: string
  code?: string
}

export class ApiClient {
  private static async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.fetchRaw<T>(endpoint, options)
    if (response.code === 'STEP_UP_REQUIRED') {
      // Do not break UI; return undefined and let global modal handle the flow
      return undefined as unknown as T
    }
    return response.data as T
  }

  static async fetchRaw<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    const data = await response.json()

    // Check for Step-Up Authentication requirement
    // This typically happens for high-risk actions (e.g. wallet withdrawal)
    if (data?.code === 'STEP_UP_REQUIRED') {
      const resumeAttempt =
        typeof options?.headers !== 'undefined' &&
        ((options!.headers as Record<string, string>)['x-step-up-resume'] === 'true' ||
          (options!.headers as Record<string, string>)['X-Step-Up-Resume'] === 'true')
      if (typeof window !== 'undefined') {
        // Client-side: Trigger the Step-Up Modal
        const actionKey = `${options?.method || 'GET'}:${endpoint}`
        if (!resumeAttempt) {
          const event = new CustomEvent(STEP_UP_EVENT, {
            detail: { 
              endpoint, 
              options, 
              actionKey,
              retryPayload: {
                method: options?.method || 'GET',
                url,
                body: options?.body
              }
            }
          })
          window.dispatchEvent(event)
        }
      }
      return { success: false, data: undefined as unknown as T, code: 'STEP_UP_REQUIRED' }
    }

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred')
    }

    return data
  }

  static services = {
    list: async (params?: URLSearchParams) => {
      const queryString = params ? `?${params.toString()}` : ''
      return ApiClient.fetchRaw<Service[]>(`/services${queryString}`)
    },
    get: async (id: string) => {
      return ApiClient.fetch<Service>(`/services/${id}`)
    },
  }

  static categories = {
    list: async () => {
      return ApiClient.fetch<Category[]>('/categories')
    },
  }

  static bookings = {
    list: async (role?: 'client' | 'steward') => {
      const queryString = role ? `?role=${role}` : ''
      return ApiClient.fetch<Booking[]>(`/bookings${queryString}`)
    },
    get: async (id: string) => {
      return ApiClient.fetch<Booking>(`/bookings/${id}`)
    },
    create: async (bookingData: Partial<Booking>) => {
      return ApiClient.fetch<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      })
    },
    updateStatus: async (id: string, status: string) => {
      return ApiClient.fetch<Booking>(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
    },
    updateAction: async (id: string, action: 'accept' | 'start' | 'complete' | 'confirm' | 'cancel', extraData?: any) => {
      return ApiClient.fetchRaw<Booking>(`/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, ...extraData }),
      })
    },
  }

  static wallet = {
    withdraw: async (payload: {
      amount: number
      accountNumber: string
      accountBank: string
      beneficiaryName?: string
      narration?: string
    }) => {
      return ApiClient.fetchRaw<any>('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
  }
  static auth = {
    signup: async (userData: Partial<User> & { password: string }) => {
      return ApiClient.fetch<User>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
    },
    signin: async (credentials: { email: string; password: string }) => {
      return ApiClient.fetch<User>('/auth/signin', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
    },
  }
}
