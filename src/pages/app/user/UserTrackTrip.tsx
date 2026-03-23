import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Crosshair } from "lucide-react";
import AppBar from "@/components/app/AppBar";
import { api } from "@/lib/api";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { useTripSocket } from "@/hooks/useTripSocket";
import { useAuthReadyForSocket } from "@/hooks/useAuthReadyForSocket";
import {
  VEHICLE_MARKER_ICON,
  VEHICLE_MARKER_WIDTH,
  VEHICLE_MARKER_HEIGHT,
} from "@/config/mapConstants";
import { MapTypeToggle } from "@/components/maps/MapTypeToggle";

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

interface TripDetailResponse {
  id: string;
  trip_id: string;
  vehicle_name: string | null;
  vehicle_no: string | null;
  end_time: string | null;
  locations: TripLocation[];
}

export default function UserTrackTrip() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<TripDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isLoaded, mapType, setMapType } = useGoogleMaps();

  const fetchTrip = async () => {
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
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  useEffect(() => {
    if (!tripId || !trip || trip.end_time) return;
    pollRef.current = setInterval(fetchTrip, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tripId, trip?.id, trip?.end_time]);

  const path = (trip?.locations ?? []).map((loc) => ({
    lat: Number(loc.latitude),
    lng: Number(loc.longitude),
  }));
  const latestLoc = trip?.locations?.length ? trip.locations[trip.locations.length - 1] : null;
  const latestPoint = path.length ? path[path.length - 1] : null;
  const targetCenter = latestPoint ?? DEFAULT_CENTER;
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
  const isActive = trip && !trip.end_time;

  const mapRef = useRef<google.maps.Map | null>(null);
  const vehicleOverlayRef = useRef<HTMLDivElement | null>(null);
  const listenerRef = useRef<google.maps.MapsEventListener[]>([]);
  const [followMode, setFollowMode] = useState(true);
  const [zoomState, setZoomState] = useState(DEFAULT_ZOOM);
  const displayCenterRef = useRef<{ lat: number; lng: number }>({ ...targetCenter });
  const displayHeadingRef = useRef<number>(targetHeading);
  const targetCenterRef = useRef<{ lat: number; lng: number }>({ ...targetCenter });
  const targetHeadingRef = useRef<number>(targetHeading);
  const lastSocketLocationAtRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const hasRecentSocketUpdate = Date.now() - lastSocketLocationAtRef.current < SOCKET_RECENCY_WINDOW_MS;
    if (hasRecentSocketUpdate) return;
    targetCenterRef.current = targetCenter;
    targetHeadingRef.current = targetHeading;
  }, [targetCenter, targetHeading]);

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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    displayCenterRef.current = { ...targetCenterRef.current };
    displayHeadingRef.current = targetHeadingRef.current;
    lastTickTimeRef.current = performance.now();
    map.setCenter(targetCenterRef.current);
    map.setZoom(DEFAULT_ZOOM);
    listenerRef.current.forEach((l) => l.remove());
    listenerRef.current = [];
    const dragListener = map.addListener("dragend", () => setFollowMode(false));
    listenerRef.current.push(dragListener);
    const zoomListener = map.addListener("zoom_changed", () => {
      const z = map.getZoom();
      if (typeof z === "number") setZoomState(z);
      setFollowMode(false);
    });
    listenerRef.current.push(zoomListener);
  }, []);

  const onMapUnmount = useCallback(() => {
    listenerRef.current.forEach((l) => l.remove());
    listenerRef.current = [];
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    mapRef.current = null;
    vehicleOverlayRef.current = null;
  }, []);

  const handleFollowPress = useCallback(() => {
    const map = mapRef.current;
    const targetC = targetCenterRef.current;
    const targetH = targetHeadingRef.current;
    displayCenterRef.current = { lat: targetC.lat, lng: targetC.lng };
    displayHeadingRef.current = targetH;
    setZoomState(DEFAULT_ZOOM);
    setFollowMode(true);
    if (map) {
      map.setCenter(displayCenterRef.current);
      map.setZoom(DEFAULT_ZOOM);
    }
  }, []);
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
        map.setCenter({ lat: displayLat, lng: displayLng });
      }
      if (vehicleOverlayRef.current) {
        vehicleOverlayRef.current.style.transform = `translate(-50%, -50%) rotate(${displayHeading}deg)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isLoaded, followMode]);

  const initialCenter = path.length ? path[0] : DEFAULT_CENTER;

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
            center={initialCenter}
            zoom={zoomState}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            options={{ zoomControl: true, streetViewControl: false, mapTypeControl: false, gestureHandling: "greedy", mapTypeId: mapType }}
          >
            {path.length > 0 && (
              <Polyline path={path} options={{ strokeColor: "#2563eb", strokeWeight: 4, strokeOpacity: 0.8 }} />
            )}
            {path.length > 0 && (
              <Marker position={path[0]} label="S" title="Start" />
            )}
          </GoogleMap>
        )}
        {isLoaded && (latestPoint || isActive) && (
          <div
            ref={vehicleOverlayRef}
            className="absolute left-1/2 top-1/2 pointer-events-none z-10 flex justify-center items-center"
            style={{
              width: VEHICLE_MARKER_WIDTH,
              height: VEHICLE_MARKER_HEIGHT,
              transform: `translate(-50%, -50%) rotate(${displayHeadingRef.current}deg)`,
            }}
            aria-hidden
          >
            <img
              src={VEHICLE_MARKER_ICON}
              alt=""
              className="object-contain drop-shadow-md w-full h-full"
            />
          </div>
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
              onClick={handleFollowPress}
              className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/90 shadow-sm backdrop-blur-sm hover:bg-muted aria-pressed:bg-muted"
              title="Follow vehicle"
              aria-label="Follow vehicle"
            >
              <Crosshair className="h-5 w-5 text-foreground" />
            </button>
            <div className="absolute bottom-4 right-16 z-10">
              <MapTypeToggle mapType={mapType} onToggle={handleMapTypeToggle} />
            </div>
          </>
        )}
      </div>
      <AppBar
        title="Live tracking"
        showBack
        className="relative z-10 bg-background/80 backdrop-blur-sm border-b border-border/50"
        right={
          isActive ? (
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
              Live
            </span>
          ) : null
        }
      />
      <div className="relative z-10 mx-4 mt-2 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm max-w-md">
        <p className="text-sm font-semibold">{trip.vehicle_name ?? trip.vehicle_no ?? "Vehicle"}</p>
        <p className="text-xs text-muted-foreground">Trip: {trip.trip_id}</p>
      </div>
      {path.length === 0 && isLoaded && (
        <div className="relative z-10 mx-4 mt-2 px-4 py-3 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 text-center text-sm text-muted-foreground">
          No location data yet. The driver may not have started moving.
        </div>
      )}
    </div>
  );
}
