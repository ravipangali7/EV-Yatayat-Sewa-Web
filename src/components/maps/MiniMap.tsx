import { useMemo, useState } from 'react';
import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
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

/** Stable reference so LoadScript is not reloaded. */
const MAP_LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];

const MARKER_ICONS = {
  start: '/start_point.png',
  end: '/end_point.png',
  stop: '/stop_point.png',
  default: '/navigation.png',
} as const;

const TYPE_LABELS: Record<'start' | 'end' | 'stop', string> = {
  start: 'Start',
  stop: 'Stop',
  end: 'End',
};

function isSameMarker(a: MarkerData, b: MarkerData) {
  return a.lat === b.lat && a.lng === b.lng && (a.name ?? '') === (b.name ?? '');
}

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
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const { isLoaded } = useJsApiLoader({
    id: 'google-mini-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

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

  const handleMarkerClick = (marker: MarkerData) => {
    setSelectedMarker((prev) => (prev && isSameMarker(prev, marker) ? null : marker));
    onMarkerClick?.(marker);
  };

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
        onClick={() => setSelectedMarker(null)}
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
          let iconUrl: string = MARKER_ICONS.default;
          if (marker.icon) {
            iconUrl = marker.icon;
          } else if (marker.type === 'start' || marker.label === 'start') {
            iconUrl = MARKER_ICONS.start;
          } else if (marker.type === 'end' || marker.label === 'end') {
            iconUrl = MARKER_ICONS.end;
          } else if (marker.type === 'stop' || marker.label === 'stop') {
            iconUrl = MARKER_ICONS.stop;
          }
          const icon = {
            url: iconUrl,
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          };

          const markerKey = (marker as MarkerData & { routeId?: string }).routeId 
            ? `marker-${(marker as MarkerData & { routeId?: string }).routeId}-${marker.type || 'default'}-${index}-${marker.lat}-${marker.lng}`
            : `marker-${marker.type || 'default'}-${index}-${marker.lat}-${marker.lng}`;

          return (
            <Marker
              key={markerKey}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={icon}
              label={marker.label && marker.label !== 'start' && marker.label !== 'end' && marker.label !== 'stop' ? marker.label : undefined}
              onClick={() => handleMarkerClick(marker)}
            />
          );
        })}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-1 min-w-[120px]">
              <div className="font-medium text-foreground">{selectedMarker.name ?? selectedMarker.label ?? 'Point'}</div>
              <div className="text-xs text-muted-foreground">
                {selectedMarker.type ? TYPE_LABELS[selectedMarker.type] : 'Point'}
              </div>
              {selectedMarker.code && (
                <div className="text-xs text-muted-foreground">Code: {selectedMarker.code}</div>
              )}
              {selectedMarker.routeName && (
                <div className="text-xs text-muted-foreground">{selectedMarker.routeName}</div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </Card>
  );
}
