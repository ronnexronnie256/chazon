'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import toast from 'react-hot-toast';

interface UserPhoneStatus {
  phone: string | null;
  phoneVerified: boolean;
}

export function PhoneVerification() {
  const [phoneStatus, setPhoneStatus] = useState<UserPhoneStatus | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    fetchPhoneStatus();
  }, []);

  const fetchPhoneStatus = async () => {
    try {
      const response = await fetch('/api/auth/phone/status');
      if (response.ok) {
        const data = await response.json();
        setPhoneStatus(data);
        if (data.phone) {
          setPhone(data.phone);
        }
      }
    } catch (error) {
      console.error('Failed to fetch phone status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/auth/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to send verification code');
        return;
      }

      toast.success('Verification code sent to your phone');
      setStep('verify');
      setCountdown(600);

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error('Failed to send verification code');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Verification failed');
        return;
      }

      toast.success('Phone number verified successfully');
      setStep('phone');
      setCode('');
      fetchPhoneStatus();
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (phoneStatus?.phoneVerified && phoneStatus?.phone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phone Number</CardTitle>
          <CardDescription>Your verified phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{phoneStatus.phone}</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </p>
            </div>
            <Button variant="outline" onClick={() => setStep('phone')}>
              Change
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phone Number</CardTitle>
        <CardDescription>
          {step === 'phone'
            ? 'Add a phone number for account recovery and notifications'
            : 'Enter the verification code sent to your phone'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0771234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSendCode} disabled={isSending || !phone}>
                  {isSending ? 'Sending...' : 'Send Code'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your Uganda phone number (e.g., 0771234567)
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={e =>
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="flex-1 font-mono text-lg tracking-widest"
                  maxLength={6}
                />
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying || code.length !== 6}
                >
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {countdown > 0 ? (
                  <>
                    Code expires in{' '}
                    <span className="font-medium">{formatTime(countdown)}</span>
                  </>
                ) : (
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={handleSendCode}
                  >
                    Resend code
                  </Button>
                )}
              </p>
            </div>
            <Button variant="ghost" onClick={() => setStep('phone')}>
              Use a different phone number
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
