import { useState, useEffect, useCallback } from "react";
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
import { Car, MapPin, User, Route } from "lucide-react";
import { toast } from "sonner";
import { DirectBookFlow } from "./DirectBookFlow";

const DEFAULT_CENTER = { lat: 27.7172, lng: 85.324 };
const RADIUS_KM = 10;
const RADIUS_METERS = RADIUS_KM * 1000;

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

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await vehicleApi.nearby({
        latitude: lat,
        longitude: lng,
        radius_km: RADIUS_KM,
      });
      setNearbyVehicles(res.results ?? []);
    } catch {
      setNearbyVehicles([]);
      toast.error("Could not load nearby vehicles");
    } finally {
      setLoading(false);
    }
  }, []);

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
                  radius={RADIUS_METERS}
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
                  label={{
                    text: v.vehicle_no?.slice(-2) ?? "V",
                    color: v.can_book ? "#166534" : "#6b7280",
                    fontSize: "11px",
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
                {selectedVehicle.can_book ? " · Within 5 km, bookable" : " · Too far to book"}
              </p>
              {selectedVehicle.can_book ? (
                <Button
                  className="w-full rounded-xl"
                  onClick={() => setShowDirectBook(true)}
                >
                  Book seat
                </Button>
              ) : (
                <p className="text-xs text-amber-600">Only vehicles within 5 km with an active trip can be booked.</p>
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
