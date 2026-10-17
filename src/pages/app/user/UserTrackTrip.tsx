import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { SvgIcon } from "@/components/app/ride/SvgIcon";
import { api } from "@/lib/api";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { useTripSocket } from "@/hooks/useTripSocket";
import { useAuthReadyForSocket } from "@/hooks/useAuthReadyForSocket";
import {
  MARKER_ANCHOR_X,
  MARKER_ANCHOR_Y,
  MARKER_HEIGHT,
  MARKER_ICONS,
  MARKER_WIDTH,
  POLYLINE_STROKE_COLOR,
  ROUTE_MARKER_ANCHOR,
  ROUTE_MARKER_SIZE,
  VEHICLE_MARKER_ICON,
} from "@/config/mapConstants";
import { MapTypeToggle } from "@/components/maps/MapTypeToggle";
import { getDirectionsPath } from "@/lib/directions";
import {
  loadVehicleMarkerImage,
  makePlainVehicleIcon,
  makeRotatedVehicleIcon,
  shouldRefreshVehicleIconRotation,
} from "@/lib/mapRotatedVehicleIcon";

const POLL_INTERVAL_MS = 3000;
const DEFAULT_CENTER = { lat: 27.7172, lng: 85.324 };
const DEFAULT_ZOOM = 14;
/** Time constant for exponential follow; slightly slower than driver map for polling. */
const SMOOTH_FOLLOW_SPEED = 5.5;
const SOCKET_RECENCY_WINDOW_MS = 4500;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHeading(from: number, to: number, t: number): number {
  const d = ((to - from + 540) % 360) - 180;
  return (from + d * t + 360) % 360;
}

function smoothFactor(dtMs: number): number {
  const dtSec = dtMs / 1000;
  return 1 - Math.exp(-dtSec * SMOOTH_FOLLOW_SPEED);
}

interface TripLocation {
  id: string;
  latitude: string;
  longitude: string;
  speed?: string | null;
  course?: string | null;
  created_at: string;
}

interface TripRouteStopPoint {
  kind?: string;
  order: number;
  place?: string;
  place_id?: string;
  place_name: string | null;
  latitude: string | null;
  longitude: string | null;
  announcement_text?: string;
  has_destination_booking?: boolean;
}

interface TripRouteOrderedPoint {
  kind: string;
  order: number;
  place_id: string;
  name: string | null;
  latitude: string | null;
  longitude: string | null;
}

interface TripRouteDetail {
  id: string;
  name: string;
  is_bidirectional?: boolean;
  start_point?: string | null;
  start_point_name?: string | null;
  start_point_lat?: string | null;
  start_point_lng?: string | null;
  end_point?: string | null;
  end_point_name?: string | null;
  end_point_lat?: string | null;
  end_point_lng?: string | null;
  stop_points?: TripRouteStopPoint[];
  ordered_points?: TripRouteOrderedPoint[];
}

interface TripDetailResponse {
  id: string;
  trip_id: string;
  vehicle_name: string | null;
  vehicle_no: string | null;
  route_name?: string | null;
  reverse_direction?: boolean;
  end_time: string | null;
  locations: TripLocation[];
  route?: TripRouteDetail | null;
}

interface RouteWaypoint {
  kind: "start" | "stop" | "end";
  order: number;
  placeId: string;
  name: string;
  lat: number;
  lng: number;
}

function parseCoord(val: string | number | null | undefined): number | null {
  if (val == null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export default function UserTrackTrip() {
  const { tripId: tripIdParam, id } = useParams<{ tripId?: string; id?: string }>();
  const tripId = tripIdParam ?? id;
  const location = useLocation();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isLoaded, mapType, setMapType } = useGoogleMaps();

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      const data = await api.get<TripDetailResponse>(`trips/${tripId}/`);
      setTrip(data);
      setError(null);
    } catch {
      setError("Trip not found or no longer available.");
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  useEffect(() => {
    if (!trip?.end_time || !tripId) return;
    if (!/\/trip\/[^/]+$/.test(location.pathname)) return;
    navigate(`${location.pathname}/ended`, { replace: true });
  }, [trip?.end_time, tripId, location.pathname, navigate]);

  useEffect(() => {
    if (!tripId || !trip || trip.end_time) return;
    pollRef.current = setInterval(fetchTrip, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tripId, trip?.id, trip?.end_time, fetchTrip]);

  const routePoints = useMemo<RouteWaypoint[]>(() => {
    const r = trip?.route;
    if (!r) return [];

    if (Array.isArray(r.ordered_points) && r.ordered_points.length > 0) {
      const valid = r.ordered_points
        .map((pt, idx) => {
          const lat = parseCoord(pt.latitude);
          const lng = parseCoord(pt.longitude);
          if (lat === null || lng === null) return null;
          const kind: "start" | "stop" | "end" =
            pt.kind === "start" || pt.kind === "stop" || pt.kind === "end"
              ? pt.kind
              : idx === 0
                ? "start"
                : idx === r.ordered_points!.length - 1
                  ? "end"
                  : "stop";
          return {
            kind,
            order: pt.order ?? idx,
            placeId: pt.place_id || `${kind}-${idx}`,
            name: pt.name || (kind === "start" ? "Start" : kind === "end" ? "End" : `Stop ${idx}`),
            lat,
            lng,
          };
        })
        .filter((x): x is RouteWaypoint => x !== null);
      if (valid.length > 0) return valid;
    }

    const stops = Array.isArray(r.stop_points) ? [...r.stop_points].sort((a, b) => a.order - b.order) : [];
    const hasExplicitKinds = stops.some((s) => s.kind === "start" || s.kind === "end");
    if (hasExplicitKinds) {
      const valid = stops
        .map((sp, idx) => {
          const lat = parseCoord(sp.latitude);
          const lng = parseCoord(sp.longitude);
          if (lat === null || lng === null) return null;
          const kind: "start" | "stop" | "end" =
            sp.kind === "start" || sp.kind === "stop" || sp.kind === "end"
              ? sp.kind
              : idx === 0
                ? "start"
                : idx === stops.length - 1
                  ? "end"
                  : "stop";
          return {
            kind,
            order: sp.order ?? idx,
            placeId: sp.place_id ?? sp.place ?? `${kind}-${idx}`,
            name: sp.place_name || (kind === "start" ? "Start" : kind === "end" ? "End" : `Stop ${idx}`),
            lat,
            lng,
          };
        })
        .filter((x): x is RouteWaypoint => x !== null);
      if (valid.length > 0) return valid;
    }

    const combined: RouteWaypoint[] = [];
    const startLat = parseCoord(r.start_point_lat);
    const startLng = parseCoord(r.start_point_lng);
    if (startLat !== null && startLng !== null) {
      combined.push({
        kind: "start",
        order: 0,
        placeId: r.start_point || "start",
        name: r.start_point_name || "Start",
        lat: startLat,
        lng: startLng,
      });
    }

    const endLat = parseCoord(r.end_point_lat);
    const endLng = parseCoord(r.end_point_lng);

    for (let i = 0; i < stops.length; i++) {
      const sp = stops[i];
      const lat = parseCoord(sp.latitude);
      const lng = parseCoord(sp.longitude);
      if (lat === null || lng === null) continue;
      const pid = sp.place_id ?? sp.place ?? `stop-${i}`;
      if (
        combined.length > 0 &&
        (combined[0].placeId === pid ||
          (Math.abs(combined[0].lat - lat) < 1e-6 && Math.abs(combined[0].lng - lng) < 1e-6))
      ) {
        continue;
      }
      if (
        endLat !== null &&
        endLng !== null &&
        ((r.end_point && r.end_point === pid) ||
          (Math.abs(endLat - lat) < 1e-6 && Math.abs(endLng - lng) < 1e-6))
      ) {
        continue;
      }
      combined.push({
        kind: "stop",
        order: sp.order ?? i + 1,
        placeId: pid,
        name: sp.place_name || `Stop ${i + 1}`,
        lat,
        lng,
      });
    }

    if (endLat !== null && endLng !== null) {
      combined.push({
        kind: "end",
        order: combined.length,
        placeId: r.end_point || "end",
        name: r.end_point_name || "End",
        lat: endLat,
        lng: endLng,
      });
    } else if (combined.length >= 2) {
      combined[0].kind = "start";
      combined[combined.length - 1].kind = "end";
    } else if (combined.length === 1) {
      combined[0].kind = "start";
    }

    return combined;
  }, [trip?.route]);

  const routeCoordsKey = useMemo(
    () => routePoints.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join("|"),
    [routePoints]
  );

  const [roadPath, setRoadPath] = useState<Array<{ lat: number; lng: number }> | null>(null);

  useEffect(() => {
    if (!isLoaded || routePoints.length < 2) {
      setRoadPath(null);
      return;
    }
    let cancelled = false;
    const waypoints = routePoints.map((p) => ({ lat: p.lat, lng: p.lng }));
    getDirectionsPath(waypoints).then((res) => {
      if (!cancelled) {
        setRoadPath(res && res.length >= 2 ? res : null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, routeCoordsKey]);

  const plannedRoutePath = useMemo(() => {
    if (roadPath && roadPath.length >= 2) return roadPath;
    if (routePoints.length >= 2) return routePoints.map((p) => ({ lat: p.lat, lng: p.lng }));
    return [];
  }, [roadPath, routePoints]);

  const path = useMemo(
    () =>
      (trip?.locations ?? [])
        .map((loc) => ({
          lat: Number(loc.latitude),
          lng: Number(loc.longitude),
        }))
        .filter((pt) => Number.isFinite(pt.lat) && Number.isFinite(pt.lng)),
    [trip?.locations]
  );

  const latestLoc = trip?.locations?.length ? trip.locations[trip.locations.length - 1] : null;
  const latestPoint = path.length ? path[path.length - 1] : null;
  const firstRoutePoint = routePoints.length > 0 ? { lat: routePoints[0].lat, lng: routePoints[0].lng } : null;
  const liveOrStartPoint = latestPoint ?? firstRoutePoint;
  const targetCenter = liveOrStartPoint ?? DEFAULT_CENTER;

  const targetHeading =
    latestLoc && latestLoc.course != null && latestLoc.course !== ""
      ? Number(latestLoc.course)
      : path.length >= 2
        ? (() => {
            if (typeof google === "undefined" || !google.maps?.geometry?.spherical) return 0;
            const from = path[path.length - 2];
            const to = path[path.length - 1];
            return google.maps.geometry.spherical.computeHeading(
              new google.maps.LatLng(from.lat, from.lng),
              new google.maps.LatLng(to.lat, to.lng)
            );
          })()
        : 0;
  const isActive = !!(trip && !trip.end_time);

  const mapRef = useRef<google.maps.Map | null>(null);
  const mapInitialCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  if (!mapInitialCenterRef.current) {
    mapInitialCenterRef.current = liveOrStartPoint ? { ...liveOrStartPoint } : { ...DEFAULT_CENTER };
  }
  const hasCenteredInitialRef = useRef(false);
  const programmaticCameraRef = useRef(false);
  const programmaticCameraUntilRef = useRef(0);

  const vehicleMarkerRef = useRef<google.maps.Marker | null>(null);
  const vehicleImageRef = useRef<HTMLImageElement | null>(null);
  const lastRotationPaintedRef = useRef<number | null>(null);
  const listenerRef = useRef<google.maps.MapsEventListener[]>([]);
  const [mapAttachTick, setMapAttachTick] = useState(0);
  const [followMode, setFollowMode] = useState(true);

  const displayCenterRef = useRef<{ lat: number; lng: number }>({ ...targetCenter });
  const displayHeadingRef = useRef<number>(targetHeading);
  const targetCenterRef = useRef<{ lat: number; lng: number }>({ ...targetCenter });
  const targetHeadingRef = useRef<number>(targetHeading);
  const lastSocketLocationAtRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    hasCenteredInitialRef.current = false;
  }, [tripId]);

  const runProgrammaticCamera = useCallback((fn: (map: google.maps.Map) => void) => {
    const map = mapRef.current;
    if (!map) return;
    programmaticCameraRef.current = true;
    programmaticCameraUntilRef.current = performance.now() + 250;
    try {
      fn(map);
    } finally {
      programmaticCameraRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!liveOrStartPoint) return;
    if (!hasCenteredInitialRef.current) {
      displayCenterRef.current = { lat: liveOrStartPoint.lat, lng: liveOrStartPoint.lng };
      targetCenterRef.current = { lat: liveOrStartPoint.lat, lng: liveOrStartPoint.lng };
      if (mapRef.current) {
        hasCenteredInitialRef.current = true;
        runProgrammaticCamera((map) => {
          map.setCenter({ lat: liveOrStartPoint.lat, lng: liveOrStartPoint.lng });
        });
      }
    }
  }, [liveOrStartPoint?.lat, liveOrStartPoint?.lng, mapAttachTick, runProgrammaticCamera]);

  useEffect(() => {
    const hasRecentSocketUpdate = Date.now() - lastSocketLocationAtRef.current < SOCKET_RECENCY_WINDOW_MS;
    if (hasRecentSocketUpdate) return;
    if (liveOrStartPoint) {
      targetCenterRef.current = { lat: liveOrStartPoint.lat, lng: liveOrStartPoint.lng };
    }
    targetHeadingRef.current = targetHeading;
  }, [liveOrStartPoint?.lat, liveOrStartPoint?.lng, targetHeading]);

  const authReadyForSocket = useAuthReadyForSocket();
  useTripSocket({
    tripId: trip?.trip_id ?? null,
    enabled: !!trip?.trip_id && !trip?.end_time,
    authReady: authReadyForSocket,
    onSeatBooked: () => {},
    onTripLocation: useCallback((payload) => {
      lastSocketLocationAtRef.current = Date.now();
      targetCenterRef.current = { lat: payload.lat, lng: payload.lng };
      if (payload.course != null) targetHeadingRef.current = payload.course;
    }, []),
  });

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      displayCenterRef.current = { ...targetCenterRef.current };
      displayHeadingRef.current = targetHeadingRef.current;
      lastTickTimeRef.current = performance.now();

      runProgrammaticCamera((m) => {
        m.setCenter(targetCenterRef.current);
        m.setZoom(DEFAULT_ZOOM);
      });

      listenerRef.current.forEach((l) => l.remove());
      listenerRef.current = [];
      const dragStartListener = map.addListener("dragstart", () => setFollowMode(false));
      listenerRef.current.push(dragStartListener);
      const zoomListener = map.addListener("zoom_changed", () => {
        if (programmaticCameraRef.current || performance.now() < programmaticCameraUntilRef.current) {
          return;
        }
        setFollowMode(false);
      });
      listenerRef.current.push(zoomListener);
      setMapAttachTick((n) => n + 1);
    },
    [runProgrammaticCamera]
  );

  const onMapUnmount = useCallback(() => {
    listenerRef.current.forEach((l) => l.remove());
    listenerRef.current = [];
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    vehicleMarkerRef.current?.setMap(null);
    vehicleMarkerRef.current = null;
    vehicleImageRef.current = null;
    lastRotationPaintedRef.current = null;
    mapRef.current = null;
  }, []);

  const showVehicleMarker = !!(latestPoint || routePoints.length > 0 || isActive);
  const showVehicleRef = useRef(showVehicleMarker);
  showVehicleRef.current = showVehicleMarker;

  useEffect(() => {
    const map = mapRef.current;
    if (!isLoaded || !map || !showVehicleMarker) {
      if (!showVehicleMarker) {
        vehicleMarkerRef.current?.setMap(null);
        vehicleMarkerRef.current = null;
        lastRotationPaintedRef.current = null;
      }
      return;
    }

    const plainIcon = makePlainVehicleIcon(
      VEHICLE_MARKER_ICON,
      MARKER_WIDTH,
      MARKER_HEIGHT,
      MARKER_ANCHOR_X,
      MARKER_ANCHOR_Y
    );

    void loadVehicleMarkerImage(VEHICLE_MARKER_ICON)
      .then((img) => {
        if (mapRef.current !== map || !showVehicleRef.current) return;
        vehicleImageRef.current = img;
        if (vehicleMarkerRef.current) {
          vehicleMarkerRef.current.setMap(map);
          return;
        }
        vehicleMarkerRef.current = new google.maps.Marker({
          map,
          position: displayCenterRef.current,
          icon: plainIcon,
          zIndex: 1000,
          optimized: false,
        });
        lastRotationPaintedRef.current = null;
      })
      .catch(() => {
        if (mapRef.current !== map || !showVehicleRef.current) return;
        if (!vehicleMarkerRef.current) {
          vehicleMarkerRef.current = new google.maps.Marker({
            map,
            position: displayCenterRef.current,
            icon: plainIcon,
            zIndex: 1000,
          });
        } else {
          vehicleMarkerRef.current.setMap(map);
        }
      });
  }, [isLoaded, mapAttachTick, showVehicleMarker, trip?.id]);

  const handleRecenter = useCallback(() => {
    const targetC = targetCenterRef.current;
    const targetH = targetHeadingRef.current;
    displayCenterRef.current = { lat: targetC.lat, lng: targetC.lng };
    displayHeadingRef.current = targetH;
    setFollowMode(true);
    runProgrammaticCamera((map) => {
      map.panTo(displayCenterRef.current);
    });
  }, [runProgrammaticCamera]);

  const handleMapTypeToggle = useCallback(() => {
    setMapType(mapType === "satellite" ? "roadmap" : "satellite");
  }, [mapType, setMapType]);

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
      const targetC = targetCenterRef.current;
      const targetH = targetHeadingRef.current;
      const t = Math.min(1, smoothFactor(dt));

      const displayLat = lerp(displayCenterRef.current.lat, targetC.lat, t);
      const displayLng = lerp(displayCenterRef.current.lng, targetC.lng, t);
      const displayHeading = lerpHeading(displayHeadingRef.current, targetH, t);

      displayCenterRef.current = { lat: displayLat, lng: displayLng };
      displayHeadingRef.current = displayHeading;

      if (followMode) {
        programmaticCameraRef.current = true;
        programmaticCameraUntilRef.current = performance.now() + 100;
        map.setCenter({ lat: displayLat, lng: displayLng });
        programmaticCameraRef.current = false;
      }

      const vehicleMarker = vehicleMarkerRef.current;
      const vehicleImg = vehicleImageRef.current;
      if (vehicleMarker && showVehicleMarker) {
        vehicleMarker.setPosition({ lat: displayLat, lng: displayLng });
        if (
          vehicleImg &&
          (lastRotationPaintedRef.current === null ||
            shouldRefreshVehicleIconRotation(lastRotationPaintedRef.current, displayHeading))
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
          lastRotationPaintedRef.current = displayHeading;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isLoaded, followMode, showVehicleMarker]);

  const startPointName =
    trip?.route?.start_point_name ??
    routePoints.find((p) => p.kind === "start")?.name ??
    null;
  const endPointName =
    trip?.route?.end_point_name ??
    routePoints.find((p) => p.kind === "end")?.name ??
    null;
  const intermediateStops = useMemo(
    () => routePoints.filter((p) => p.kind === "stop"),
    [routePoints]
  );
  const routeDisplayName = trip?.route?.name ?? trip?.route_name ?? null;

  if (loading && !trip) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar title="Live tracking" showBack />
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar title="Live tracking" showBack />
        <div className="px-5 py-12 text-center text-muted-foreground">{error ?? "Trip not found."}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="absolute inset-0 z-0">
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapInitialCenterRef.current}
            zoom={DEFAULT_ZOOM}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            options={{
              clickableIcons: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              gestureHandling: "greedy",
              mapTypeId: mapType,
            }}
          >
            {plannedRoutePath.length >= 2 && (
              <Polyline
                path={plannedRoutePath}
                options={{
                  strokeColor: POLYLINE_STROKE_COLOR,
                  strokeWeight: 4,
                  strokeOpacity: 0.85,
                  zIndex: 1,
                }}
              />
            )}
            {path.length > 1 && (
              <Polyline
                path={path}
                options={{
                  strokeColor: "#1C8C42",
                  strokeWeight: 5,
                  strokeOpacity: 0.95,
                  zIndex: 2,
                }}
              />
            )}
            {routePoints.map((pt) => (
              <Marker
                key={`route-${pt.kind}-${pt.order}-${pt.placeId}`}
                position={{ lat: pt.lat, lng: pt.lng }}
                title={
                  pt.kind === "start"
                    ? `Start: ${pt.name}`
                    : pt.kind === "end"
                      ? `Destination: ${pt.name}`
                      : pt.name
                }
                zIndex={pt.kind === "stop" ? 10 : 20}
                icon={{
                  url: MARKER_ICONS[pt.kind],
                  scaledSize: new google.maps.Size(ROUTE_MARKER_SIZE, ROUTE_MARKER_SIZE),
                  anchor: new google.maps.Point(ROUTE_MARKER_ANCHOR, ROUTE_MARKER_ANCHOR),
                }}
              />
            ))}
            {routePoints.length === 0 && path.length > 0 && (
              <Marker
                position={path[0]}
                title="Start"
                icon={{
                  url: MARKER_ICONS.start,
                  scaledSize: new google.maps.Size(ROUTE_MARKER_SIZE, ROUTE_MARKER_SIZE),
                  anchor: new google.maps.Point(ROUTE_MARKER_ANCHOR, ROUTE_MARKER_ANCHOR),
                }}
              />
            )}
          </GoogleMap>
        )}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 text-muted-foreground">
            Loading map...
          </div>
        )}
        {isLoaded && (
          <>
            <button
              type="button"
              onClick={handleRecenter}
              className={`absolute bottom-52 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors ${
                followMode
                  ? "border-[#1C8C42] bg-[#E7F8EC] text-[#1C8C42]"
                  : "border-[#E4EEE8] bg-white text-[#1C8C42]"
              }`}
              title="Re-center / Follow vehicle"
              aria-label="Re-center / Follow vehicle"
            >
              <SvgIcon name="locate" className="h-5 w-5 text-[#1C8C42]" />
            </button>
            <div className="absolute bottom-52 right-16 z-10">
              <MapTypeToggle mapType={mapType} onToggle={handleMapTypeToggle} />
            </div>
          </>
        )}
      </div>
      <AppBar
        title="Live Tracking"
        showBack
        variant="green"
        className="relative z-10"
        right={
          isActive ? (
            <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold text-white">Live</span>
          ) : (
            <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold text-white">
              Trip completed
            </span>
          )
        }
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4">
        <div className="pointer-events-auto mx-auto w-full max-w-lg rounded-2xl border border-[#E4EEE8] bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F8EC] text-[#1C8C42]">
              <SvgIcon name="bus" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#163024]">{trip.vehicle_name ?? "EV Yatayat"}</p>
              <p className="text-xs text-[#6D7B74]">{trip.vehicle_no ?? trip.trip_id}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase text-[#6D7B74]">Status</p>
              <p className="text-xs font-bold text-[#1C8C42]">{isActive ? "Live" : "Trip completed"}</p>
            </div>
          </div>
          {(routeDisplayName || (startPointName && endPointName)) && (
            <div className="mt-3 rounded-xl border border-[#E4EEE8] bg-[#F8FBF9] px-3 py-2">
              {routeDisplayName && (
                <p className="truncate text-xs font-semibold text-[#163024]">{routeDisplayName}</p>
              )}
              {startPointName && endPointName && (
                <p className="truncate text-xs text-[#4A5D54]">
                  {startPointName} → {endPointName}
                </p>
              )}
              {intermediateStops.length > 0 && (
                <p className="mt-0.5 truncate text-[11px] text-[#6D7B74]">
                  Stops ({intermediateStops.length}): {intermediateStops.map((s) => s.name).join(" • ")}
                </p>
              )}
            </div>
          )}
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#1C8C42] py-2.5 text-sm font-semibold text-white">
            <SvgIcon name="map-pin" className="h-4 w-4" />
            {isActive ? "Live tracking active" : "Trip completed"}
          </div>
        </div>
      </div>
      {path.length === 0 && routePoints.length === 0 && isLoaded && (
        <div className="relative z-10 mx-4 mt-2 px-4 py-3 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 text-center text-sm text-muted-foreground">
          No location data yet. The driver may not have started moving.
        </div>
      )}
    </div>
  );
}

