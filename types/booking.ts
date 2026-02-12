import type { Service } from './service'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type Booking = {
  id: string
  service: Service
  scheduledDate: string
  scheduledTime: string
  address: string
  notes?: string
  status: BookingStatus
  stewardId?: string // For role checking
  clientId?: string // For role checking
  isPaid?: boolean // Whether payment has been completed
  isPaymentReleased?: boolean // Whether payment has been released to steward
  paymentTransaction?: {
    id: string
    amount: number
    currency: string
    paymentMethod?: string
    completedAt: string
  } | null
  payoutTransaction?: {
    id: string
    amount: number
    releasedAt: string
  } | null
}

