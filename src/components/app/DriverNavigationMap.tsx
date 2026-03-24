import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { Crosshair } from "lucide-react";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { MapTypeToggle } from "@/components/maps/MapTypeToggle";
import {
  MARKER_ANCHOR_X,
  MARKER_ANCHOR_Y,
  MARKER_ICONS,
  MARKER_HEIGHT,
  MARKER_WIDTH,
  NAV_ZOOM,
  POLYLINE_STROKE_COLOR,
  POLYLINE_STROKE_OPACITY,
  POLYLINE_STROKE_WEIGHT,
  ROUTE_MARKER_ANCHOR,
  ROUTE_MARKER_SIZE,
} from "@/config/mapConstants";
import { GOOGLE_MAPS_CONFIG } from "@/config/maps";
import { getDirectionsPath } from "@/lib/directions";
import {
  loadVehicleMarkerImage,
  makePlainVehicleIcon,
  makeRotatedVehicleIcon,
  shouldRefreshVehicleIconRotation,
} from "@/lib/mapRotatedVehicleIcon";

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
  /** Current position (smoothed; map recenters in follow mode). */
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
  const vehicleMarkerRef = useRef<google.maps.Marker | null>(null);
  const vehicleImageRef = useRef<HTMLImageElement | null>(null);
  const lastVehicleIconModeRef = useRef<"plain" | "rotated" | null>(null);
  const lastRotationPaintedRef = useRef<number | null>(null);
  const listenerRef = useRef<google.maps.MapsEventListener[]>([]);
  const [followMode, setFollowMode] = useState(true);
  const [zoomState, setZoomState] = useState(NAV_ZOOM);
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

  const { isLoaded, mapType, setMapType } = useGoogleMaps();
  const mapId = GOOGLE_MAPS_CONFIG.mapId;

  const handleFollowPress = useCallback(() => {
    const map = mapRef.current;
    const targetC = targetCenterRef.current;
    const targetH = targetHeadingRef.current;
    displayCenterRef.current = { lat: targetC.lat, lng: targetC.lng };
    displayHeadingRef.current = targetH;
    setZoomState(NAV_ZOOM);
    setFollowMode(true);
    if (map) {
      map.setCenter(displayCenterRef.current);
      map.setZoom(NAV_ZOOM);
      const setHeadingFn = typeof (map as google.maps.Map & { setHeading?: (n: number) => void }).setHeading === "function"
        ? (map as google.maps.Map & { setHeading: (n: number) => void }).setHeading
        : null;
      if (setHeadingFn) setHeadingFn.call(map, targetH);
    }
  }, []);
  const handleMapTypeToggle = useCallback(() => {
    setMapType(mapType === "satellite" ? "roadmap" : "satellite");
  }, [mapType, setMapType]);

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
      map.setZoom(NAV_ZOOM);
      if (typeof (map as google.maps.Map & { setHeading?: (n: number) => void }).setHeading === "function") {
        (map as google.maps.Map & { setHeading: (n: number) => void }).setHeading(targetHeading);
      }
      listenerRef.current.forEach((l) => l.remove());
      listenerRef.current = [];
      const dragStartListener = map.addListener("dragstart", () => setFollowMode(false));
      listenerRef.current.push(dragStartListener);
      const dragListener = map.addListener("dragend", () => setFollowMode(false));
      listenerRef.current.push(dragListener);
      const zoomListener = map.addListener("zoom_changed", () => {
        const z = map.getZoom();
        if (typeof z === "number") setZoomState(z);
        setFollowMode(false);
      });
      listenerRef.current.push(zoomListener);

      const plainIcon = makePlainVehicleIcon(
        MARKER_ICONS.current,
        MARKER_WIDTH,
        MARKER_HEIGHT,
        MARKER_ANCHOR_X,
        MARKER_ANCHOR_Y
      );
      void loadVehicleMarkerImage(MARKER_ICONS.current)
        .then((img) => {
          if (mapRef.current !== map) return;
          vehicleImageRef.current = img;
          if (vehicleMarkerRef.current) {
            vehicleMarkerRef.current.setMap(null);
            vehicleMarkerRef.current = null;
          }
          vehicleMarkerRef.current = new google.maps.Marker({
            map,
            position: displayCenterRef.current,
            icon: plainIcon,
            zIndex: 1000,
            optimized: false,
          });
          lastVehicleIconModeRef.current = null;
          lastRotationPaintedRef.current = null;
        })
        .catch(() => {
          if (mapRef.current !== map) return;
          vehicleImageRef.current = null;
          if (!vehicleMarkerRef.current) {
            vehicleMarkerRef.current = new google.maps.Marker({
              map,
              position: displayCenterRef.current,
              icon: plainIcon,
              zIndex: 1000,
            });
            lastVehicleIconModeRef.current = "plain";
            lastRotationPaintedRef.current = null;
          }
        });
    },
    [center.lat, center.lng, targetHeading]
  );
  const onMapUnmount = useCallback(() => {
    listenerRef.current.forEach((l) => l.remove());
    listenerRef.current = [];
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    vehicleMarkerRef.current?.setMap(null);
    vehicleMarkerRef.current = null;
    vehicleImageRef.current = null;
    lastVehicleIconModeRef.current = null;
    lastRotationPaintedRef.current = null;
    mapRef.current = null;
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

      if (followMode) {
        map.setCenter({ lat: displayLat, lng: displayLng });
        if (setHeadingFn) setHeadingFn.call(map, displayHeading);
      }

      const vehicleMarker = vehicleMarkerRef.current;
      const vehicleImg = vehicleImageRef.current;
      if (vehicleMarker) {
        vehicleMarker.setPosition({ lat: displayLat, lng: displayLng });
      }
      if (vehicleMarker && vehicleImg) {
        const usePlainIcon = followMode && !!setHeadingFn;
        if (usePlainIcon) {
          if (lastVehicleIconModeRef.current !== "plain") {
            vehicleMarker.setIcon(
              makePlainVehicleIcon(
                MARKER_ICONS.current,
                MARKER_WIDTH,
                MARKER_HEIGHT,
                MARKER_ANCHOR_X,
                MARKER_ANCHOR_Y
              )
            );
            lastVehicleIconModeRef.current = "plain";
            lastRotationPaintedRef.current = null;
          }
        } else {
          const modeSwitch = lastVehicleIconModeRef.current !== "rotated";
          if (
            modeSwitch ||
            shouldRefreshVehicleIconRotation(lastRotationPaintedRef.current, displayHeading)
          ) {
            vehicleMarker.setIcon(
              makeRotatedVehicleIcon(
                vehicleImg,
                displayHeading,
                MARKER_WIDTH,
                MARKER_HEIGHT,
                MARKER_ANCHOR_X,
                MARKER_ANCHOR_Y
              )
            );
            lastVehicleIconModeRef.current = "rotated";
            lastRotationPaintedRef.current = displayHeading;
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isLoaded, liveTargetRef, mapId, followMode]);

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
  }
  mapOptions.mapTypeId = mapType;

  return (
    <div className={`relative rounded-xl overflow-hidden h-full min-h-[200px] ${className}`} style={{ height: "100%" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", minHeight: 200 }}
        center={centerForMap}
        zoom={zoomState}
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
      <button
        type="button"
        onClick={handleFollowPress}
        className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/90 shadow-sm backdrop-blur-sm hover:bg-muted aria-pressed:bg-muted"
        title="Center on vehicle"
        aria-label="Center on vehicle"
      >
        <Crosshair className="h-5 w-5 text-foreground" />
      </button>
      <div className="absolute bottom-3 right-16 z-10">
        <MapTypeToggle mapType={mapType} onToggle={handleMapTypeToggle} />
      </div>
    </div>
  );
}
