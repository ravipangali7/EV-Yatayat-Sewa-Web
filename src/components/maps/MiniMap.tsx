import { useMemo } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';
import { Card } from '@/components/ui/card';

interface MarkerData {
  lat: number;
  lng: number;
  label?: string;
  icon?: string;
  name?: string;
  code?: string;
  type?: 'start' | 'end' | 'stop';
  routeId?: string;
  routeName?: string;
}

interface PolylineData {
  path: Array<{ lat: number; lng: number }>;
  color?: string;
  routeId?: string;
  routeName?: string;
}

interface MiniMapProps {
  markers?: MarkerData[];
  polylines?: Array<{ lat: number; lng: number }[]> | PolylineData[];
  height?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
  defaultCenter?: { lat: number; lng: number };
  onMarkerClick?: (marker: MarkerData) => void;
  onPolylineClick?: (routeId: string, routeName: string, path: Array<{ lat: number; lng: number }>) => void;
}

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060,
};

// Custom pin icons
const startPinIcon = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 48 16 48S32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#00FF00"/>
      <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
    </svg>
  `),
  scaledSize: { width: 32, height: 48 },
  anchor: { x: 16, y: 48 },
};

const endPinIcon = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 48 16 48S32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#FF0000"/>
      <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
    </svg>
  `),
  scaledSize: { width: 32, height: 48 },
  anchor: { x: 16, y: 48 },
};

const stopPinIcon = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 48 16 48S32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#FFA500"/>
      <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
    </svg>
  `),
  scaledSize: { width: 32, height: 48 },
  anchor: { x: 16, y: 48 },
};

const defaultPinIcon = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 48 16 48S32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#4285F4"/>
      <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
    </svg>
  `),
  scaledSize: { width: 32, height: 48 },
  anchor: { x: 16, y: 48 },
};

export function MiniMap({
  markers = [],
  polylines = [],
  height = '300px',
  zoom,
  center,
  defaultCenter: propDefaultCenter,
  onMarkerClick,
  onPolylineClick,
}: MiniMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-mini-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'geometry'],
  });

  // Create properly typed icons when API is loaded
  const getPinIcons = useMemo(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps) {
      return {
        start: startPinIcon,
        end: endPinIcon,
        stop: stopPinIcon,
        default: defaultPinIcon,
      };
    }

    const createIcon = (fillColor: string) => ({
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 48 16 48S32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="${fillColor}"/>
          <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(32, 48),
      anchor: new google.maps.Point(16, 48),
    });

    return {
      start: createIcon('#00FF00'),
      end: createIcon('#FF0000'),
      stop: createIcon('#FFA500'),
      default: createIcon('#4285F4'),
    };
  }, [isLoaded]);

  // Calculate center and bounds from markers if not provided
  const mapCenter = useMemo(() => {
    if (center) return center;
    if (propDefaultCenter) return propDefaultCenter;
    if (markers.length === 0) return defaultCenter;

    // Only calculate bounds if Google Maps API is loaded
    if (!isLoaded || typeof google === 'undefined' || !google.maps) {
      return defaultCenter;
    }

    const bounds = new google.maps.LatLngBounds();
    markers.forEach((marker) => {
      bounds.extend({ lat: marker.lat, lng: marker.lng });
    });
    return bounds.getCenter().toJSON();
  }, [center, propDefaultCenter, markers, isLoaded]);

  const mapZoom = useMemo(() => {
    if (zoom) return zoom;
    if (markers.length === 0) return 10;
    if (markers.length === 1) return 15;
    return 12;
  }, [zoom, markers.length]);

  if (!isLoaded) {
    return (
      <Card className="overflow-hidden">
        <div className="w-full bg-muted flex items-center justify-center" style={{ height }}>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height }}
        center={mapCenter}
        zoom={mapZoom}
        options={{
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* Render polylines */}
        {polylines.map((polyline, index) => {
          // Support both old format (array of coordinates) and new format (PolylineData)
          const isLegacyFormat = Array.isArray(polyline);
          const path = isLegacyFormat ? polyline : polyline.path;
          const color = isLegacyFormat ? '#4285F4' : (polyline.color || '#4285F4');
          const routeId = isLegacyFormat ? undefined : polyline.routeId;
          const routeName = isLegacyFormat ? undefined : polyline.routeName;

          return (
            <Polyline
              key={`polyline-${index}`}
              path={path}
              options={{
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 3,
                clickable: !!onPolylineClick && !!routeId,
              }}
              onClick={() => {
                if (onPolylineClick && routeId && routeName) {
                  onPolylineClick(routeId, routeName, path);
                }
              }}
            />
          );
        })}

        {/* Render markers */}
        {markers.map((marker, index) => {
          let icon: google.maps.Icon | string = getPinIcons.default as google.maps.Icon;
          if (marker.icon) {
            icon = {
              url: marker.icon,
              scaledSize: new google.maps.Size(32, 48),
              anchor: new google.maps.Point(16, 48),
            };
          } else if (marker.type === 'start' || marker.label === 'start') {
            icon = getPinIcons.start as google.maps.Icon;
          } else if (marker.type === 'end' || marker.label === 'end') {
            icon = getPinIcons.end as google.maps.Icon;
          } else if (marker.type === 'stop' || marker.label === 'stop') {
            icon = getPinIcons.stop as google.maps.Icon;
          }

          // Create unique key for marker
          const markerKey = (marker as MarkerData & { routeId?: string }).routeId 
            ? `marker-${(marker as MarkerData & { routeId?: string }).routeId}-${marker.type || 'default'}-${index}-${marker.lat}-${marker.lng}`
            : `marker-${marker.type || 'default'}-${index}-${marker.lat}-${marker.lng}`;

          // Debug logging for stop points
          if (marker.type === 'stop' || marker.label === 'stop') {
            console.log(`[MiniMap] Rendering stop marker: ${marker.name} at (${marker.lat}, ${marker.lng}) with icon:`, icon);
          }

          return (
            <Marker
              key={markerKey}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={icon}
              label={marker.label && marker.label !== 'start' && marker.label !== 'end' && marker.label !== 'stop' ? marker.label : undefined}
              onClick={() => {
                if (onMarkerClick) {
                  onMarkerClick(marker);
                }
              }}
            />
          );
        })}
      </GoogleMap>
    </Card>
  );
}
