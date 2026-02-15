import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";
import {
  FIT_BOUNDS_PADDING,
  MARKER_ICONS,
  MAX_ZOOM_AFTER_FIT,
  NEPAL_CENTER,
  POLYLINE_STROKE_COLOR,
  POLYLINE_STROKE_OPACITY,
  POLYLINE_STROKE_WEIGHT,
  ROUTE_MARKER_ANCHOR,
  ROUTE_MARKER_SIZE,
} from "@/config/mapConstants";
import { getDirectionsPath } from "@/lib/directions";

/** Stable reference so LoadScript is not reloaded. */
const MAP_LIBRARIES: ("geometry")[] = ["geometry"];

export interface MapPoint {
  name: string;
  lat: number;
  lng: number;
  type: "start" | "end" | "stop" | "current";
}

const TYPE_LABELS: Record<MapPoint["type"], string> = {
  start: "Start",
  stop: "Stop",
  end: "End",
  current: "Vehicle",
};

interface MiniMapProps {
  points: MapPoint[];
  className?: string;
  /** When true, map and wrapper use height 100% so the map fills the parent. */
  fillHeight?: boolean;
}

const MiniMap = ({ points, className = "", fillHeight = false }: MiniMapProps) => {
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const { isLoaded } = useJsApiLoader({
    id: "google-app-minimap",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  const routeWaypoints = useMemo(
    () => points.filter((p) => p.type !== "current").map((p) => ({ lat: p.lat, lng: p.lng })),
    [points]
  );

  const straightPath = useMemo(
    () => points.map((p) => ({ lat: p.lat, lng: p.lng })),
    [points]
  );

  const [roadPath, setRoadPath] = useState<Array<{ lat: number; lng: number }> | null>(null);

  const routeWaypointsKey = useMemo(() => JSON.stringify(routeWaypoints), [routeWaypoints]);

  useEffect(() => {
    if (!isLoaded || routeWaypoints.length < 2) {
      setRoadPath(null);
      return;
    }
    let cancelled = false;
    getDirectionsPath(routeWaypoints).then((path) => {
      if (!cancelled && path) setRoadPath(path);
      else if (!cancelled) setRoadPath(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, routeWaypointsKey, routeWaypoints]);

  const polylinePath = roadPath && roadPath.length >= 2 ? roadPath : (straightPath.length >= 2 ? straightPath : null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);
  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const routePointsForBounds = useMemo(
    () => points.filter((p) => p.type !== "current"),
    [points]
  );
  const pointsKey = useMemo(
    () => routePointsForBounds.map((p) => `${p.lat},${p.lng}`).join("|"),
    [routePointsForBounds]
  );
  useEffect(() => {
    if (!isLoaded || typeof google === "undefined" || !mapRef.current || routePointsForBounds.length < 2) return;
    const map = mapRef.current;
    const bounds = new google.maps.LatLngBounds();
    routePointsForBounds.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, FIT_BOUNDS_PADDING);
    const listener = map.addListener("idle", () => {
      google.maps.event.removeListener(listener);
      const zoom = map.getZoom();
      if (zoom != null && zoom > MAX_ZOOM_AFTER_FIT) {
        map.setZoom(MAX_ZOOM_AFTER_FIT);
      }
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [isLoaded, routePointsForBounds.length, pointsKey, routePointsForBounds]);

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

  const containerHeight = fillHeight ? "100%" : "280px";
  const containerStyle = fillHeight
    ? { width: "100%", height: "100%", minHeight: 200 }
    : { width: "100%", height: containerHeight };
  const wrapperStyle = fillHeight ? { height: "100%", minHeight: 200 } : { minHeight: 200 };
  const wrapperClass = fillHeight ? `rounded-xl overflow-hidden h-full ${className}` : `rounded-xl overflow-hidden ${className}`;

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
      <div className={wrapperClass} style={wrapperStyle}>
        <GoogleMap
          mapContainerStyle={fillHeight ? { width: "100%", height: "100%", minHeight: 200 } : { width: "100%", height: "200px" }}
          center={NEPAL_CENTER}
          zoom={6}
          options={{
            clickableIcons: false,
            disableDefaultUI: true,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            gestureHandling: "greedy",
          }}
        />
      </div>
    );
  }

  const handleMarkerClick = (point: MapPoint) => {
    setSelectedPoint((prev) => (prev === point ? null : point));
  };

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={mapZoom}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        }}
        onClick={() => setSelectedPoint(null)}
      >
        {polylinePath && (
          <Polyline
            path={polylinePath}
            options={{
              strokeColor: POLYLINE_STROKE_COLOR,
              strokeOpacity: POLYLINE_STROKE_OPACITY,
              strokeWeight: POLYLINE_STROKE_WEIGHT,
            }}
          />
        )}
        {points.map((point, i) => (
          <Marker
            key={`${point.type}-${i}-${point.lat}-${point.lng}`}
            position={{ lat: point.lat, lng: point.lng }}
            title={point.name}
            icon={{
              url: MARKER_ICONS[point.type],
              scaledSize: new google.maps.Size(ROUTE_MARKER_SIZE, ROUTE_MARKER_SIZE),
              anchor: new google.maps.Point(ROUTE_MARKER_ANCHOR, ROUTE_MARKER_ANCHOR),
            }}
            onClick={() => handleMarkerClick(point)}
          />
        ))}
        {selectedPoint && (
          <InfoWindow
            position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
            onCloseClick={() => setSelectedPoint(null)}
          >
            <div className="p-1 min-w-[120px]">
              <div className="font-medium text-foreground">{selectedPoint.name}</div>
              <div className="text-xs text-muted-foreground">{TYPE_LABELS[selectedPoint.type]}</div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MiniMap;
