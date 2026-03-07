import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { api } from "@/lib/api";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import {
  VEHICLE_MARKER_ICON,
  VEHICLE_MARKER_WIDTH,
  VEHICLE_MARKER_HEIGHT,
  VEHICLE_MARKER_ANCHOR_X,
  VEHICLE_MARKER_ANCHOR_Y,
} from "@/config/mapConstants";

const POLL_INTERVAL_MS = 5000;
const DEFAULT_CENTER = { lat: 27.7172, lng: 85.324 };

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
  const { isLoaded } = useGoogleMaps();

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
  const latestPoint = path.length ? path[path.length - 1] : null;
  const center = latestPoint ?? DEFAULT_CENTER;
  const isActive = trip && !trip.end_time;

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
    <div className="min-h-screen bg-background flex flex-col">
      <AppBar
        title="Live tracking"
        showBack
        right={
          isActive ? (
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">Live</span>
          ) : null
        }
      />
      <div className="px-4 py-2 bg-white dark:bg-card/80 border-b border-border/50">
        <p className="text-sm font-semibold">{trip.vehicle_name ?? trip.vehicle_no ?? "Vehicle"}</p>
        <p className="text-xs text-muted-foreground">Trip: {trip.trip_id}</p>
      </div>
      <div className="flex-1 min-h-[300px] relative">
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%", minHeight: "300px" }}
            center={center}
            zoom={path.length > 1 ? 14 : 12}
            options={{ zoomControl: true, streetViewControl: false, mapTypeControl: false }}
          >
            {path.length > 0 && (
              <Polyline path={path} options={{ strokeColor: "#2563eb", strokeWeight: 4, strokeOpacity: 0.8 }} />
            )}
            {path.length > 0 && (
              <Marker position={path[0]} label="S" title="Start" />
            )}
            {latestPoint && typeof window !== "undefined" && window.google?.maps && (
              <Marker
                position={latestPoint}
                title="Vehicle"
                icon={{
                  url: VEHICLE_MARKER_ICON,
                  scaledSize: new window.google.maps.Size(VEHICLE_MARKER_WIDTH, VEHICLE_MARKER_HEIGHT),
                  anchor: new window.google.maps.Point(VEHICLE_MARKER_ANCHOR_X, VEHICLE_MARKER_ANCHOR_Y),
                }}
              />
            )}
          </GoogleMap>
        )}
        {!isLoaded && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Loading map...</div>}
      </div>
      {path.length === 0 && isLoaded && (
        <div className="px-5 py-4 text-center text-sm text-muted-foreground">No location data yet. The driver may not have started moving.</div>
      )}
    </div>
  );
}
