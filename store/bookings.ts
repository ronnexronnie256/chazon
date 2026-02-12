import { create } from 'zustand'
import type { Booking } from '@/types/booking'
import { ApiClient } from '@/lib/api-client'

type BookingsState = {
  bookings: Booking[]
  isLoading: boolean
  error: string | null
  fetchBookings: () => Promise<void>
  createBooking: (params: {
    serviceId: string
    scheduledDate: Date
    scheduledTime: string
    address: string
    notes?: string
    promoCode?: string
  }) => Promise<string>
}

export const useBookingsStore = create<BookingsState>((set) => ({
  bookings: [],
  isLoading: false,
  error: null,
  fetchBookings: async () => {
    set({ isLoading: true, error: null })
    try {
      const bookings = await ApiClient.bookings.list()
      set({ bookings })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },
  createBooking: async ({ serviceId, scheduledDate, scheduledTime, address, notes, promoCode }) => {
    set({ isLoading: true, error: null })
    try {
      const booking = await ApiClient.bookings.create({
        serviceId,
        scheduledDate: scheduledDate.toISOString(),
        scheduledTime,
        address,
        notes,
        promoCode,
      } as any)
      set((state) => ({ bookings: [booking, ...state.bookings] }))
      return booking.id
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
}))
