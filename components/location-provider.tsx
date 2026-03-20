'use client';

import { createContext, useContext, ReactNode } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface LocationContextValue {
  location: Location | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  onRequestLocation: () => void;
  isLocationEnabled: boolean;
}

const LocationContext = createContext<LocationContextValue>({
  location: null,
  status: 'idle',
  onRequestLocation: () => {},
  isLocationEnabled: false,
});

export function useLocation() {
  return useContext(LocationContext);
}

interface LocationProviderProps {
  children: ReactNode;
  location: Location | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  onRequestLocation: () => void;
}

export function LocationProvider({
  children,
  location,
  status,
  onRequestLocation,
}: LocationProviderProps) {
  return (
    <LocationContext.Provider
      value={{
        location,
        status,
        onRequestLocation,
        isLocationEnabled: status === 'success' && location !== null,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}
