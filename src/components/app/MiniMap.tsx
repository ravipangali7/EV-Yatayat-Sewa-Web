import { useMemo } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";

export interface MapPoint {
  name: string;
  lat: number;
  lng: number;
  type: "start" | "end" | "stop" | "current";
}

interface MiniMapProps {
  points: MapPoint[];
  className?: string;
}

const NEPAL_CENTER = { lat: 27.7172, lng: 85.324 };

const createPinIcon = (fillColor: string) =>
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 48 16 48S32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="${fillColor}"/>
      <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
    </svg>
  `);

const pinIcons = {
  start: createPinIcon("#22c55e"),
  end: createPinIcon("#ef4444"),
  stop: createPinIcon("#f97316"),
  current: createPinIcon("#3b82f6"),
};

const MiniMap = ({ points, className = "" }: MiniMapProps) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-app-minimap",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["geometry"],
  });

  const path = useMemo(
    () => points.map((p) => ({ lat: p.lat, lng: p.lng })),
    [points]
  );

  const mapCenter = useMemo(() => {
    if (points.length === 0) return NEPAL_CENTER;
    if (points.length === 1) return { lat: points[0].lat, lng: points[0].lng };
    const sum = points.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
      { lat: 0, lng: 0 }
    );
    return {
      lat: sum.lat / points.length,
      lng: sum.lng / points.length,
    };
  }, [points]);

  const mapZoom = useMemo(() => {
    if (points.length <= 1) return 14;
    if (points.length <= 3) return 12;
    return 10;
  }, [points.length]);

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/50 rounded-xl text-muted-foreground text-sm ${className}`}
        style={{ minHeight: 200 }}
      >
        Loading map...
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className={`rounded-xl overflow-hidden ${className}`} style={{ minHeight: 200 }}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "200px" }}
          center={NEPAL_CENTER}
          zoom={6}
          options={{
            clickableIcons: false,
            disableDefaultUI: true,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ minHeight: 200 }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "280px" }}
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
        {path.length >= 2 && (
          <Polyline
            path={path}
            options={{
              strokeColor: "#3b82f6",
              strokeOpacity: 0.8,
              strokeWeight: 3,
            }}
          />
        )}
        {points.map((point, i) => (
          <Marker
            key={`${point.type}-${i}-${point.lat}-${point.lng}`}
            position={{ lat: point.lat, lng: point.lng }}
            title={point.name}
            icon={{
              url: pinIcons[point.type],
              scaledSize: new google.maps.Size(28, 42),
              anchor: new google.maps.Point(14, 42),
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default MiniMap;
