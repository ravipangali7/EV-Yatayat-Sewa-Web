import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
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
  mapType: google.maps.MapTypeId;
  setMapType: (mapType: google.maps.MapTypeId) => void;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader(LOADER_OPTIONS);
  const [mapType, setMapType] = useState<google.maps.MapTypeId>(() => {
    if (typeof window === 'undefined') return 'roadmap';
    const saved = window.localStorage.getItem('app-map-type');
    return saved === 'satellite' ? 'satellite' : 'roadmap';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('app-map-type', mapType);
  }, [mapType]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, mapType, setMapType }}>
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
