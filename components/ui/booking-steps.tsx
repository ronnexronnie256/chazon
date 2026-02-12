'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBookingsStore } from '@/store/bookings'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

type BookingStepsProps = { serviceId: string }

export function BookingSteps({ serviceId }: BookingStepsProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { createBooking } = useBookingsStore()
  const [step, setStep] = useState(1)
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [scheduledTime, setScheduledTime] = useState<string>('10:00')
  const [address, setAddress] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [promoCode, setPromoCode] = useState<string>('')
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState<{ amount: number; type: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const next = () => setStep((s) => Math.min(s + 1, 4))
  const back = () => setStep((s) => Math.max(s - 1, 1))

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoDiscount(null)
      return
    }

    setValidatingPromo(true)
    try {
      // We need the base price to validate the promo code
      // For now, we'll validate it when creating the booking
      // But we can show a message that it will be validated
      setPromoDiscount({ amount: 0, type: 'pending' })
      toast.success('Promo code will be validated during booking')
    } catch (error) {
      toast.error('Failed to validate promo code')
      setPromoDiscount(null)
    } finally {
      setValidatingPromo(false)
    }
  }

  const submit = async () => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }
    if (!scheduledDate || !address) return
    setIsSubmitting(true)
    try {
      const id = await createBooking({
        serviceId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        address,
        notes,
        promoCode: promoCode.trim() || undefined,
      })
      router.push(`/booking/confirmation/${id}`)
    } catch (error) {
      console.error('Booking failed:', error)
      toast.error('Failed to create booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Step {step} of 4</div>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          <label className="block text-sm font-medium text-gray-700">Time</label>
          <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <Input type="text" placeholder="123 Main St, City" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <Input type="text" placeholder="Any instructions for the steward" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Promo Code (Optional)</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={validatePromoCode}
              disabled={validatingPromo || !promoCode.trim()}
            >
              {validatingPromo ? 'Validating...' : 'Apply'}
            </Button>
          </div>
          {promoDiscount && (
            <p className="text-sm text-green-600">Promo code will be applied during booking</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={back} disabled={step === 1 || isSubmitting}>Back</Button>
        {step < 4 ? (
          <Button onClick={next} disabled={isSubmitting}>Next</Button>
        ) : (
          <Button onClick={submit} disabled={isSubmitting || !scheduledDate || !address} className="bg-chazon-primary hover:bg-chazon-primary-dark">Confirm Booking</Button>
        )}
      </div>
    </div>
  )
}

