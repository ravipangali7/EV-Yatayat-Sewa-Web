import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { Card } from '@/components/ui/card';
import { MapTypeToggle } from '@/components/maps/MapTypeToggle';

interface GoogleMapComponentProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (lat: number, lng: number, address: string) => void;
  height?: string;
  zoom?: number;
  clickable?: boolean;
  customPinIcon?: string;
}

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 27.7172,
  lng: 85.3240,
};

const defaultPinIcon = {
  url: '/navigation.png',
  scaledSize: { width: 32, height: 32 },
  anchor: { x: 16, y: 16 },
};

export function GoogleMapComponent({
  latitude,
  longitude,
  onLocationChange,
  height = '400px',
  zoom = 15,
  clickable = true,
  customPinIcon: customIcon,
}: GoogleMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentPosition, setCurrentPosition] = useState({ lat: latitude, lng: longitude });
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, mapType, setMapType } = useGoogleMaps();

  // Sync marker position and pan map when latitude/longitude change from parent (e.g. "Current location" button)
  useEffect(() => {
    const pos = { lat: latitude, lng: longitude };
    setCurrentPosition(pos);
    if (mapRef.current && (latitude !== 0 || longitude !== 0)) {
      mapRef.current.panTo(pos);
    }
  }, [latitude, longitude]);

  const center = {
    lat: latitude || defaultCenter.lat,
    lng: longitude || defaultCenter.lng,
  };

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance;
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Reverse geocode using OpenStreetMap Nominatim API
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://geo.mylunago.com/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      return data.display_name || '';
    } catch {
      return '';
    }
  }, []);

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!clickable || !onLocationChange || !e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setCurrentPosition({ lat, lng });

      // Get address from Nominatim
      const address = await reverseGeocode(lat, lng);
      onLocationChange(lat, lng, address);
    },
    [clickable, onLocationChange, reverseGeocode]
  );
  const handleMapTypeToggle = () => {
    setMapType(mapType === 'satellite' ? 'roadmap' : 'satellite');
  };

  if (!isLoaded) {
    return (
      <Card className="overflow-hidden">
        <div className="w-full bg-muted flex items-center justify-center" style={{ height }}>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </Card>
    );
  }

  const pinIcon = customIcon
    ? {
        url: customIcon,
        scaledSize: { width: 32, height: 32 },
        anchor: { x: 16, y: 16 },
      }
    : defaultPinIcon;

  return (
    <Card className="overflow-hidden relative">
      <GoogleMap
        mapContainerStyle={{ ...containerStyle, height }}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          clickableIcons: false,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          mapTypeId: mapType,
        }}
      >
        <Marker
          position={currentPosition}
          icon={
            pinIcon
              ? {
                  ...pinIcon,
                  scaledSize: new window.google.maps.Size(32, 32),
                  anchor: new window.google.maps.Point(16, 16),
                }
              : defaultPinIcon
          }
          draggable={clickable}
          onDragEnd={async (e) => {
            if (!onLocationChange || !e.latLng) return;
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setCurrentPosition({ lat, lng });
            const address = await reverseGeocode(lat, lng);
            onLocationChange(lat, lng, address);
          }}
        />
      </GoogleMap>
      <div className="absolute top-3 right-3 z-10">
        <MapTypeToggle mapType={mapType} onToggle={handleMapTypeToggle} />
      </div>
    </Card>
  );
}
