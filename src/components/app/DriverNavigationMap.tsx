import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";
import { getDirectionsPath } from "@/lib/directions";

const MAP_LIBRARIES: ("geometry")[] = ["geometry"];
const NEPAL_CENTER = { lat: 27.7172, lng: 85.324 };
const NAV_ZOOM = 16;

export interface DriverNavigationMapProps {
  /** Current position (map pans so this stays under the fixed marker). */
  center: { lat: number; lng: number };
  /** Previous position; if set, heading is computed from prev -> center for map rotation. */
  previousCenter?: { lat: number; lng: number } | null;
  /** Route waypoints for polyline (start, stops, end). */
  routeWaypoints?: Array<{ lat: number; lng: number }>;
  className?: string;
}

function computeHeading(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  if (typeof google === "undefined" || !google.maps?.geometry?.spherical) return 0;
  return google.maps.geometry.spherical.computeHeading(
    new google.maps.LatLng(from.lat, from.lng),
    new google.maps.LatLng(to.lat, to.lng)
  );
}

export default function DriverNavigationMap({
  center,
  previousCenter,
  routeWaypoints = [],
  className = "",
}: DriverNavigationMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [roadPath, setRoadPath] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const heading =
    previousCenter && (previousCenter.lat !== center.lat || previousCenter.lng !== center.lng)
      ? computeHeading(previousCenter, center)
      : 0;
  const { isLoaded } = useJsApiLoader({
    id: "google-driver-nav-map",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  const routeWaypointsKey = useMemo(
    () => routeWaypoints.map((w) => `${w.lat},${w.lng}`).join("|"),
    [routeWaypoints]
  );

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      map.setCenter(center);
      if (typeof (map as google.maps.Map & { setHeading?: (n: number) => void }).setHeading === "function") {
        (map as google.maps.Map & { setHeading: (n: number) => void }).setHeading(heading);
      }
    },
    [center.lat, center.lng, heading]
  );
  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

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
  }, [isLoaded, routeWaypointsKey]);

  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const map = mapRef.current;
    map.setCenter(center);
    if (typeof map.setHeading === "function") {
      map.setHeading(heading);
    }
  }, [isLoaded, center.lat, center.lng, heading]);

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 rounded-xl text-muted-foreground text-sm ${className}`} style={{ minHeight: 200 }}>
        Loading map...
      </div>
    );
  }

  const polylinePath = roadPath && roadPath.length >= 2 ? roadPath : (routeWaypoints.length >= 2 ? routeWaypoints : null);

  return (
    <div className={`relative rounded-xl overflow-hidden h-full min-h-[200px] ${className}`} style={{ height: "100%" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", minHeight: 200 }}
        center={center}
        zoom={NAV_ZOOM}
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
          mapTypeId: google.maps.MapTypeId.HYBRID,
        }}
      >
        {polylinePath && (
          <Polyline
            path={polylinePath}
            options={{
              strokeColor: "#3b82f6",
              strokeOpacity: 0.8,
              strokeWeight: 3,
            }}
          />
        )}
      </GoogleMap>
      <div
        className="absolute left-1/2 top-8 -translate-x-1/2 pointer-events-none z-10 flex justify-center"
        style={{ top: "28px" }}
        aria-hidden
      >
        <img src="/navigation.png" alt="" className="w-10 h-10 object-contain drop-shadow-md" />
      </div>
    </div>
  );
}
