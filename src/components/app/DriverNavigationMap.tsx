import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import {
  MARKER_ICONS,
  NAVIGATION_MARKER_SIZE,
  NAV_ZOOM,
  POLYLINE_STROKE_COLOR,
  POLYLINE_STROKE_OPACITY,
  POLYLINE_STROKE_WEIGHT,
  ROUTE_MARKER_ANCHOR,
  ROUTE_MARKER_SIZE,
} from "@/config/mapConstants";
import { GOOGLE_MAPS_CONFIG } from "@/config/maps";
import { getDirectionsPath } from "@/lib/directions";

/** Time constant for exponential follow: display = lerp(display, target, 1 - exp(-dt * k)). Higher = faster follow. */
const SMOOTH_FOLLOW_SPEED = 6;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHeading(from: number, to: number, t: number): number {
  let d = ((to - from + 540) % 360) - 180;
  return (from + d * t + 360) % 360;
}

/** Exponential smoothing factor for one frame: 1 - exp(-dt * k) */
function smoothFactor(dtMs: number): number {
  const dtSec = dtMs / 1000;
  return 1 - Math.exp(-dtSec * SMOOTH_FOLLOW_SPEED);
}

export type RouteMarkerType = "start" | "stop" | "end";

export interface RouteMarkerPoint {
  lat: number;
  lng: number;
  name?: string;
  type: RouteMarkerType;
}

export interface LiveTargetSnapshot {
  center: { lat: number; lng: number };
  previousCenter?: { lat: number; lng: number } | null;
  heading?: number | null;
}

export interface DriverNavigationMapProps {
  /** Current position (map pans so this stays under the fixed marker). */
  center: { lat: number; lng: number };
  /** Previous position; if set, heading is computed from prev -> center for map rotation. */
  previousCenter?: { lat: number; lng: number } | null;
  /** Optional heading in degrees (0-360). When provided, used for marker rotation instead of computing from previousCenter/center. */
  heading?: number | null;
  /** When provided (e.g. from Flutter WebView), RAF loop reads target from this ref for smooth updates without re-renders. */
  liveTargetRef?: React.MutableRefObject<LiveTargetSnapshot | null>;
  /** Route waypoints for polyline (start, stops, end). */
  routeWaypoints?: Array<{ lat: number; lng: number }>;
  /** Start, stop, and end markers to show on the map. */
  routeMarkers?: RouteMarkerPoint[];
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
  heading: headingOverride,
  liveTargetRef,
  routeWaypoints = [],
  routeMarkers = [],
  className = "",
}: DriverNavigationMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [roadPath, setRoadPath] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const computedHeading =
    previousCenter && (previousCenter.lat !== center.lat || previousCenter.lng !== center.lng)
      ? computeHeading(previousCenter, center)
      : 0;
  const targetHeading =
    headingOverride != null && typeof headingOverride === "number"
      ? headingOverride
      : computedHeading;

  const displayCenterRef = useRef<{ lat: number; lng: number }>({ ...center });
  const displayHeadingRef = useRef<number>(targetHeading);
  const targetCenterRef = useRef<{ lat: number; lng: number }>({ ...center });
  const targetHeadingRef = useRef<number>(targetHeading);
  const lastTickTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);
  /** When liveTargetRef is provided, freeze center so GoogleMap does not override RAF-driven setCenter on re-renders. */
  const initialCenterRef = useRef<{ lat: number; lng: number }>({ lat: center.lat, lng: center.lng });

  const { isLoaded } = useGoogleMaps();
  const mapId = GOOGLE_MAPS_CONFIG.mapId;

  // Update target refs from props when not using live ref
  targetCenterRef.current = { lat: center.lat, lng: center.lng };
  targetHeadingRef.current = targetHeading;

  // When using live ref, keep initial center stable; otherwise sync so prop-driven updates work
  if (!liveTargetRef) {
    initialCenterRef.current = { lat: center.lat, lng: center.lng };
  }
  const centerForMap = liveTargetRef ? initialCenterRef.current : center;

  const routeWaypointsKey = useMemo(
    () => routeWaypoints.map((w) => `${w.lat},${w.lng}`).join("|"),
    [routeWaypoints]
  );

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      displayCenterRef.current = { lat: center.lat, lng: center.lng };
      displayHeadingRef.current = targetHeading;
      lastTickTimeRef.current = performance.now();
      map.setCenter(center);
      if (typeof (map as google.maps.Map & { setHeading?: (n: number) => void }).setHeading === "function") {
        (map as google.maps.Map & { setHeading: (n: number) => void }).setHeading(targetHeading);
      }
    },
    [center.lat, center.lng, targetHeading]
  );
  const onMapUnmount = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    mapRef.current = null;
    overlayRef.current = null;
  }, []);

  // Continuous interpolation: every frame move display toward target (from props or liveTargetRef)
  useEffect(() => {
    if (!isLoaded) return;
    const tick = (now: number) => {
      const map = mapRef.current;
      if (!map) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;

      // Read target from live ref if provided, else use prop-backed refs
      if (liveTargetRef?.current) {
        const live = liveTargetRef.current;
        targetCenterRef.current = { ...live.center };
        if (live.heading != null && typeof live.heading === "number") {
          targetHeadingRef.current = live.heading;
        } else if (live.previousCenter && (live.previousCenter.lat !== live.center.lat || live.previousCenter.lng !== live.center.lng)) {
          targetHeadingRef.current = computeHeading(live.previousCenter, live.center);
        }
      }

      const setHeadingFn = typeof (map as google.maps.Map & { setHeading?: (n: number) => void }).setHeading === "function"
        ? (map as google.maps.Map & { setHeading: (n: number) => void }).setHeading
        : null;
      const targetC = targetCenterRef.current;
      const targetH = targetHeadingRef.current;
      const t = Math.min(1, smoothFactor(dt));

      const displayLat = lerp(displayCenterRef.current.lat, targetC.lat, t);
      const displayLng = lerp(displayCenterRef.current.lng, targetC.lng, t);
      const displayHeading = lerpHeading(displayHeadingRef.current, targetH, t);

      displayCenterRef.current = { lat: displayLat, lng: displayLng };
      displayHeadingRef.current = displayHeading;

      map.setCenter({ lat: displayLat, lng: displayLng });
      if (setHeadingFn) setHeadingFn.call(map, displayHeading);

      if (overlayRef.current) {
        overlayRef.current.style.transform = `translate(-50%, -50%) rotate(${displayHeading}deg)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isLoaded, liveTargetRef, mapId]);

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

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 rounded-xl text-muted-foreground text-sm ${className}`} style={{ minHeight: 200 }}>
        Loading map...
      </div>
    );
  }

  const polylinePath = roadPath && roadPath.length >= 2 ? roadPath : (routeWaypoints.length >= 2 ? routeWaypoints : null);

  const mapOptions: google.maps.MapOptions = {
    clickableIcons: false,
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    gestureHandling: "greedy",
  };
  if (mapId) {
    mapOptions.mapId = mapId;
  } else {
    mapOptions.mapTypeId = google.maps.MapTypeId.HYBRID;
  }

  return (
    <div className={`relative rounded-xl overflow-hidden h-full min-h-[200px] ${className}`} style={{ height: "100%" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", minHeight: 200 }}
        center={centerForMap}
        zoom={NAV_ZOOM}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={mapOptions}
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
        {routeMarkers.map((marker, i) => (
          <Marker
            key={`${marker.type}-${i}-${marker.lat}-${marker.lng}`}
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.name}
            icon={{
              url: MARKER_ICONS[marker.type],
              scaledSize: new google.maps.Size(ROUTE_MARKER_SIZE, ROUTE_MARKER_SIZE),
              anchor: new google.maps.Point(ROUTE_MARKER_ANCHOR, ROUTE_MARKER_ANCHOR),
            }}
          />
        ))}
      </GoogleMap>
      <div
        ref={overlayRef}
        className="absolute left-1/2 top-1/2 pointer-events-none z-10 flex justify-center items-center"
        style={{
          width: NAVIGATION_MARKER_SIZE,
          height: NAVIGATION_MARKER_SIZE,
          transform: `translate(-50%, -50%) rotate(${displayHeadingRef.current}deg)`,
        }}
        aria-hidden
      >
        <img
          src={MARKER_ICONS.current}
          alt=""
          className="object-contain drop-shadow-md w-full h-full"
        />
      </div>
    </div>
  );
}
