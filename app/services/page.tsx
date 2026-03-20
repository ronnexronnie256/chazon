'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { LocationProvider } from '@/components/location-provider';
import { ServicesContent } from '@/components/services-content';
import { ServicesLoadingSkeleton } from '@/components/services-loading-skeleton';

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
        maximumAge: 300000,
      }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <LocationProvider
      location={location}
      status={locationStatus}
      onRequestLocation={requestLocation}
    >
      <Suspense fallback={<ServicesLoadingSkeleton />}>
        <ServicesContent location={location} />
      </Suspense>
    </LocationProvider>
  );
}
