'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { useBookingsStore } from '@/store/bookings'

interface BookNowButtonProps {
  serviceId: string
}

export function BookNowButton({ serviceId }: BookNowButtonProps) {
  const { isAuthenticated } = useAuthStore()
  const { createBooking } = useBookingsStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleBooking = async () => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    setIsLoading(true)

    try {
      const id = createBooking({
        serviceId,
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        scheduledTime: '10:00 AM',
        address: '123 Main St, Anytown, USA',
        notes: 'Please ring the doorbell upon arrival.',
      })
      router.push(`/booking/confirmation/${id}`)
    } catch (error) {
      console.error('Booking request failed:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      className="w-full mb-6"
      onClick={handleBooking}
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : 'Book Now'}
    </Button>
  )
}
