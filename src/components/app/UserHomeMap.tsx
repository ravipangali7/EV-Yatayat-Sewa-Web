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
import type { VehicleNearby } from "@/types";
import { VEHICLE_MARKER_ICON, ROUTE_MARKER_ANCHOR, ROUTE_MARKER_SIZE } from "@/config/mapConstants";
import { Car, MapPin, User, Route } from "lucide-react";
import { toast } from "sonner";
import { DirectBookFlow } from "./DirectBookFlow";

const DEFAULT_CENTER = { lat: 27.7172, lng: 85.324 };
/** Map fits to this radius (visible area 10 km). */
const MAP_FIT_RADIUS_KM = 10;
const MAP_FIT_RADIUS_METERS = MAP_FIT_RADIUS_KM * 1000;
/** Fetch vehicles up to 200 km (e.g. Nepal radius); bookable when 5 km < distance <= 200 km. */
const FETCH_RADIUS_KM = 200;

const containerStyle = { width: "100%", height: "280px" };

export function UserHomeMap() {
  const { isLoaded } = useGoogleMaps();
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyVehicles, setNearbyVehicles] = useState<VehicleNearby[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleNearby | null>(null);
  const [showDirectBook, setShowDirectBook] = useState(false);

  const center = userPosition
    ? { lat: userPosition.lat, lng: userPosition.lng }
    : DEFAULT_CENTER;

  const mapRef = useRef<google.maps.Map | null>(null);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await vehicleApi.nearby({
        latitude: lat,
        longitude: lng,
        radius_km: FETCH_RADIUS_KM,
      });
      setNearbyVehicles(res.results ?? []);
    } catch {
      setNearbyVehicles([]);
      toast.error("Could not load nearby vehicles");
    } finally {
      setLoading(false);
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
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserPosition({ lat, lng });
        fetchNearby(lat, lng);
      },
      () => {
        setUserPosition(null);
        fetchNearby(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [fetchNearby]);

  const handleMarkerClick = (v: VehicleNearby) => {
    setSelectedVehicle(v);
  };

  const handleCloseModal = () => {
    setSelectedVehicle(null);
    setShowDirectBook(false);
  };

  const handleBookSuccess = () => {
    handleCloseModal();
    toast.success("Seat booked successfully");
  };

  if (!isLoaded) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border/50 bg-muted/30 flex items-center justify-center h-[280px]">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-border/50 bg-white dark:bg-card/80 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
          Nearby vehicles
        </p>
        <div style={containerStyle} className="rounded-xl">
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
                    scaledSize: new google.maps.Size(ROUTE_MARKER_SIZE, ROUTE_MARKER_SIZE),
                    anchor: new google.maps.Point(ROUTE_MARKER_ANCHOR, ROUTE_MARKER_ANCHOR),
                  }}
                />
              );
            })}
          </GoogleMap>
        </div>
        {loading && (
          <p className="text-xs text-muted-foreground text-center py-2">Loading vehicles...</p>
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
                {selectedVehicle.can_book ? " · Bookable (5–200 km, active route)" : " · Not bookable"}
              </p>
              {selectedVehicle.can_book ? (
                <Button
                  className="w-full rounded-xl"
                  onClick={() => setShowDirectBook(true)}
                >
                  Book seat
                </Button>
              ) : (
                <p className="text-xs text-amber-600">Only vehicles with active trip, between 5 km and 200 km away, can be booked.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedVehicle && showDirectBook && (
        <DirectBookFlow
          vehicle={selectedVehicle}
          userPosition={userPosition}
          onClose={handleCloseModal}
          onSuccess={handleBookSuccess}
        />
      )}
    </>
  );
}
