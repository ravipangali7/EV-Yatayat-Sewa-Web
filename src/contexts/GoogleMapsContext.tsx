import { createContext, useContext, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';

/** Single canonical loader options so the script is only loaded once. */
const LOADER_OPTIONS = {
  id: GOOGLE_MAPS_CONFIG.id,
  googleMapsApiKey: GOOGLE_MAPS_CONFIG.apiKey,
  libraries: GOOGLE_MAPS_CONFIG.libraries,
};

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader(LOADER_OPTIONS);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps(): GoogleMapsContextType {
  const ctx = useContext(GoogleMapsContext);
  if (ctx === undefined) {
    throw new Error('useGoogleMaps must be used within GoogleMapsProvider');
  }
  return ctx;
}
