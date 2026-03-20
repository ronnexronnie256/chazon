'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBookingsStore } from '@/store/bookings';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

type BookingStepsProps = { serviceId: string };

export function BookingSteps({ serviceId }: BookingStepsProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { createBooking } = useBookingsStore();
  const [step, setStep] = useState(1);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('10:00');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState<{
    amount: number;
    type: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoDiscount(null);
      return;
    }
    setValidatingPromo(true);
    try {
      setPromoDiscount({ amount: 0, type: 'pending' });
      toast.success('Promo code will be validated during booking');
    } catch (error) {
      toast.error('Failed to validate promo code');
      setPromoDiscount(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const initiatePayment = async (taskId: string) => {
    setIsInitiatingPayment(true);
    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      if (data.link) {
        window.location.href = data.link;
        return;
      }

      throw new Error('No payment link received');
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setIsInitiatingPayment(false);
    }
  };

  const submit = async () => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    if (!scheduledDate || !address) return;

    setIsSubmitting(true);
    try {
      const id = await createBooking({
        serviceId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        address,
        notes,
        promoCode: promoCode.trim() || undefined,
      });

      toast.success('Booking created! Initiating payment...');

      await initiatePayment(id);
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Step {step} of 4</div>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={e => setScheduledDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <label className="block text-sm font-medium text-gray-700">
            Time
          </label>
          <Input
            type="time"
            value={scheduledTime}
            onChange={e => setScheduledTime(e.target.value)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <Input
            type="text"
            placeholder="123 Main St, Kololo, Kampala"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Enter your location in Kampala
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <Input
            type="text"
            placeholder="Any special instructions for the steward"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Promo Code (Optional)
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={validatePromoCode}
              disabled={validatingPromo || !promoCode.trim()}
            >
              {validatingPromo ? 'Applying...' : 'Apply'}
            </Button>
          </div>
          {promoDiscount && (
            <p className="text-sm text-green-600">Promo code will be applied</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={back}
            disabled={isSubmitting || isInitiatingPayment}
          >
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button onClick={next} disabled={isSubmitting}>
            Next
          </Button>
        ) : (
          <Button
            onClick={submit}
            disabled={
              isSubmitting || isInitiatingPayment || !scheduledDate || !address
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting
              ? 'Creating booking...'
              : isInitiatingPayment
                ? 'Processing payment...'
                : 'Pay Now'}
          </Button>
        )}
      </div>
    </div>
  );
}
