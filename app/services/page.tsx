'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { LocationProvider } from '@/components/location-provider';
import { ServicesContent } from '@/components/services-content';

export default function ServicesPageWrapper() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');

    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('success');
      },
      () => {
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  useEffect(() => {
    // Auto-request location on mount (non-blocking)
    requestLocation();
  }, [requestLocation]);

  return (
    <LocationProvider
      location={location}
      status={locationStatus}
      onRequestLocation={requestLocation}
    >
      <ServicesContent location={location} />
    </LocationProvider>
  );
}
