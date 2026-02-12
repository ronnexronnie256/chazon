import { Booking } from '@/types/booking'

// In-memory store for bookings
// This will reset when the server restarts
export const mockBookingsStore: Booking[] = []
