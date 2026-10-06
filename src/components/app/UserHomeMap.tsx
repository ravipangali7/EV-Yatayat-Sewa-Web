import { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, Marker, Circle } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { vehicleApi } from "@/modules/vehicles/services/vehicleApi";
import { superSettingApi } from "@/modules/settings/services/superSettingApi";
import type { VehicleNearby } from "@/types";
import { toNumber } from "@/lib/utils";
import {
  MARKER_ANCHOR_X,
  MARKER_ANCHOR_Y,
  MARKER_HEIGHT,
  MARKER_WIDTH,
  VEHICLE_MARKER_ICON,
} from "@/config/mapConstants";
import { Car, MapPin, User, Route } from "lucide-react";
import { toast } from "sonner";
import { DirectBookFlow } from "./DirectBookFlow";
import { MapTypeToggle } from "@/components/maps/MapTypeToggle";
import { isAvailable as isFlutterBridgeAvailable, requestLocation } from "@/lib/flutterBridge";

const DEFAULT_CENTER = { lat: 27.7172, lng: 85.324 };
/** Map fits to this radius (visible area 10 km). */
const MAP_FIT_RADIUS_KM = 10;
const MAP_FIT_RADIUS_METERS = MAP_FIT_RADIUS_KM * 1000;
/** Fetch vehicles up to 200 km (e.g. Nepal radius); bookable when 5 km < distance <= 200 km. */
const FETCH_RADIUS_KM = 200;

const containerStyle = { width: "100%", height: "360px" };

const DEFAULT_BOOK_MIN_KM = 5;
const DEFAULT_BOOK_MAX_KM = 200;
/** How long to wait for the Flutter WebView to inject FlutterBridge before using the browser. */
const BRIDGE_WAIT_MS = 2000;
/** Refresh nearby vehicles so a trip that just started still appears. */
const NEARBY_REFRESH_MS = 12000;

function waitForFlutterBridge(timeoutMs = BRIDGE_WAIT_MS): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (isFlutterBridgeAvailable()) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (available: boolean) => {
      if (settled) return;
      settled = true;
      window.clearInterval(timer);
      window.clearTimeout(giveUp);
      window.removeEventListener("flutterAuthReady", onReady);
      resolve(available);
    };
    const onReady = () => finish(isFlutterBridgeAvailable());
    window.addEventListener("flutterAuthReady", onReady);
    const timer = window.setInterval(() => {
      if (isFlutterBridgeAvailable()) finish(true);
    }, 200);
    const giveUp = window.setTimeout(() => finish(false), timeoutMs);
  });
}

function browserGeolocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not available in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Turn on location to see vehicles near you.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

function toPassengerLocationError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  if (!raw || /denied|permission|location is off|turn on|not available|unavailable|timed out/i.test(raw)) {
    return "Turn on location to see vehicles near you.";
  }
  return raw;
}

function coordsFromFlutter(result: { success: boolean; lat?: number; lng?: number }): { lat: number; lng: number } | null {
  if (
    result.success &&
    result.lat != null &&
    result.lng != null &&
    Number.isFinite(result.lat) &&
    Number.isFinite(result.lng)
  ) {
    return { lat: result.lat, lng: result.lng };
  }
  return null;
}

/**
 * In the app, ask Flutter first. If that fails, use the page location API,
 * which the WebView now grants the same way Chrome does.
 */
async function getPassengerLocation(): Promise<{ lat: number; lng: number }> {
  const inApp = await waitForFlutterBridge();
  if (inApp) {
    const native = coordsFromFlutter(await requestLocation());
    if (native) return native;
  }
  try {
    return await browserGeolocation();
  } catch (browserError) {
    if (isFlutterBridgeAvailable()) {
      const native = coordsFromFlutter(await requestLocation());
      if (native) return native;
    }
    throw browserError;
  }
}

export function UserHomeMap() {
  const { isLoaded, mapType, setMapType } = useGoogleMaps();
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyVehicles, setNearbyVehicles] = useState<VehicleNearby[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleNearby | null>(null);
  const [showDirectBook, setShowDirectBook] = useState(false);
  const [directBookVehicle, setDirectBookVehicle] = useState<VehicleNearby | null>(null);
  const [loadingDirectBook, setLoadingDirectBook] = useState(false);
  const [bookMinKm, setBookMinKm] = useState(DEFAULT_BOOK_MIN_KM);
  const [bookMaxKm, setBookMaxKm] = useState(DEFAULT_BOOK_MAX_KM);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAttempt, setLocationAttempt] = useState(0);

  const center = userPosition
    ? { lat: userPosition.lat, lng: userPosition.lng }
    : DEFAULT_CENTER;

  const mapRef = useRef<google.maps.Map | null>(null);

  const fetchNearby = useCallback(async (lat: number, lng: number, options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const res = await vehicleApi.nearby({
        latitude: lat,
        longitude: lng,
        radius_km: FETCH_RADIUS_KM,
        active_trip_only: true,
      });
      setNearbyVehicles(res.results ?? []);
    } catch {
      if (!options?.silent) {
        setNearbyVehicles([]);
        toast.error("Could not load nearby vehicles");
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (userPosition) {
      const center = new google.maps.LatLng(userPosition.lat, userPosition.lng);
      const bounds = new google.maps.Circle({ center, radius: MAP_FIT_RADIUS_METERS }).getBounds();
      if (bounds) map.fitBounds(bounds);
    }
  }, [userPosition]);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  /** Fit map bounds to 10 km around user so initial view shows only 10 km (markers up to 200 km still rendered). */
  useEffect(() => {
    if (!userPosition || !mapRef.current) return;
    const center = new google.maps.LatLng(userPosition.lat, userPosition.lng);
    const bounds = new google.maps.Circle({
      center,
      radius: MAP_FIT_RADIUS_METERS,
    }).getBounds();
    if (bounds) mapRef.current.fitBounds(bounds);
  }, [userPosition]);

  useEffect(() => {
    let cancelled = false;
    setLocationError(null);
    getPassengerLocation()
      .then(({ lat, lng }) => {
        if (cancelled) return;
        setUserPosition({ lat, lng });
        fetchNearby(lat, lng);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setUserPosition(null);
        setNearbyVehicles([]);
        const message = toPassengerLocationError(err);
        setLocationError(message);
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchNearby, locationAttempt]);

  useEffect(() => {
    if (!userPosition) return;
    const id = window.setInterval(() => {
      fetchNearby(userPosition.lat, userPosition.lng, { silent: true });
    }, NEARBY_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [userPosition, fetchNearby]);

  useEffect(() => {
    superSettingApi.list({ per_page: 1 }).then((res) => {
      const setting = res.results?.[0];
      if (setting) {
        setBookMinKm(toNumber(setting.short_trip_min_distance_for_booking, DEFAULT_BOOK_MIN_KM));
        setBookMaxKm(toNumber(setting.short_trip_max_distance_for_booking, DEFAULT_BOOK_MAX_KM));
      }
    }).catch(() => {});
  }, []);

  const handleMarkerClick = (v: VehicleNearby) => {
    setSelectedVehicle(v);
  };

  const handleCloseModal = () => {
    setSelectedVehicle(null);
    setShowDirectBook(false);
    setDirectBookVehicle(null);
  };

  const handleBookSeat = async () => {
    if (!selectedVehicle?.id) return;
    setLoadingDirectBook(true);
    try {
      const vehicle = await vehicleApi.getDirectBookInfo(selectedVehicle.id);
      setDirectBookVehicle(vehicle);
      setShowDirectBook(true);
    } catch {
      toast.error("Could not load seat details. Please try again.");
    } finally {
      setLoadingDirectBook(false);
    }
  };

  const handleBookSuccess = () => {
    handleCloseModal();
    toast.success("Seat booked successfully");
  };
  const handleMapTypeToggle = () => {
    setMapType(mapType === "satellite" ? "roadmap" : "satellite");
  };

  if (!isLoaded) {
    return (
      <div className="w-full bg-muted/30 flex items-center justify-center h-[360px]">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full">
        <div style={containerStyle} className="relative w-full">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={12}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            options={{
              clickableIcons: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              mapTypeId: mapType,
            }}
          >
            {userPosition && (
              <>
                <Circle
                  center={userPosition}
                  radius={MAP_FIT_RADIUS_METERS}
                  options={{
                    strokeColor: "#22c55e",
                    strokeOpacity: 0.6,
                    strokeWeight: 2,
                    fillColor: "#22c55e",
                    fillOpacity: 0.08,
                  }}
                />
                <Marker
                  position={userPosition}
                  title="You"
                  zIndex={10}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  }}
                />
              </>
            )}
            {nearbyVehicles.map((v) => {
              const lat = parseFloat(v.last_latitude);
              const lng = parseFloat(v.last_longitude);
              if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
              return (
                <Marker
                  key={v.id}
                  position={{ lat, lng }}
                  title={v.name}
                  onClick={() => handleMarkerClick(v)}
                  icon={{
                    url: VEHICLE_MARKER_ICON,
                    scaledSize: new google.maps.Size(MARKER_WIDTH, MARKER_HEIGHT),
                    anchor: new google.maps.Point(MARKER_ANCHOR_X, MARKER_ANCHOR_Y),
                  }}
                />
              );
            })}
          </GoogleMap>
          <p className="absolute top-3 left-3 z-10 text-[11px] font-semibold uppercase tracking-wider bg-white/90 text-foreground px-2 py-1 rounded-md shadow-sm">
            Nearby vehicles
          </p>
          <div className="absolute top-3 right-3 z-10">
            <MapTypeToggle mapType={mapType} onToggle={handleMapTypeToggle} />
          </div>
        </div>
        {loading && (
          <p className="absolute bottom-2 left-0 right-0 z-10 text-xs text-center text-white drop-shadow">
            Loading vehicles...
          </p>
        )}
        {locationError && !loading && (
          <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs text-foreground shadow-sm">
            <span>{locationError}</span>
            <Button type="button" size="sm" variant="outline" className="h-7 shrink-0" onClick={() => setLocationAttempt((n) => n + 1)}>
              Try again
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!selectedVehicle && !showDirectBook} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              {selectedVehicle?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground font-medium">{selectedVehicle.vehicle_no}</p>
              {selectedVehicle.active_driver_details && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Driver: {selectedVehicle.active_driver_details.name || selectedVehicle.active_driver_details.phone}</span>
                </div>
              )}
              {selectedVehicle.active_route_details && (
                <div className="flex items-start gap-2">
                  <Route className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedVehicle.active_route_details.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {selectedVehicle.active_route_details.start_point_details?.name} → {selectedVehicle.active_route_details.end_point_details?.name}
                    </p>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedVehicle.distance_km} km away
                {selectedVehicle.can_book ? ` · Bookable (${bookMinKm}–${bookMaxKm} km, active route)` : " · Not bookable"}
              </p>
              {selectedVehicle.can_book ? (
                <Button
                  className="w-full rounded-xl"
                  onClick={handleBookSeat}
                  disabled={loadingDirectBook}
                >
                  {loadingDirectBook ? "Loading…" : "Book seat"}
                </Button>
              ) : (
                <p className="text-xs text-amber-600">Only vehicles with active trip, between {bookMinKm} km and {bookMaxKm} km away, can be booked.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showDirectBook && directBookVehicle && (
        <DirectBookFlow
          vehicle={directBookVehicle}
          userPosition={userPosition}
          onClose={handleCloseModal}
          onSuccess={handleBookSuccess}
        />
      )}
    </>
  );
}
