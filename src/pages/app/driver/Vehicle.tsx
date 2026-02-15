import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { QrCode, MapPin, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import VehicleCard from "@/components/app/VehicleCard";
import type { VehicleInfo } from "@/components/app/VehicleCard";
import RouteCard from "@/components/app/RouteCard";
import type { RouteInfo } from "@/components/app/RouteCard";
import SeatLayout, { Seat } from "@/components/app/SeatLayout";
import SwipeButton from "@/components/app/SwipeButton";
import ConfirmModal from "@/components/app/ConfirmModal";
import MiniMap, { MapPoint } from "@/components/app/MiniMap";
import DriverNavigationMap from "@/components/app/DriverNavigationMap";
import TransactionCard from "@/components/app/TransactionCard";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleApi } from "@/modules/vehicles/services/vehicleApi";
import { routeApi } from "@/modules/routes/services/routeApi";
import { tripApi, type ActiveTrip, type TripStartConfirmScheduled } from "@/modules/trips/services/tripApi";
import { routeToRouteInfo } from "@/lib/routeMap";
import { isAvailable as isFlutterBridgeAvailable, requestScan as requestNativeScan, requestLocation, startLocationStream, stopLocationStream } from "@/lib/flutterBridge";
import { Vehicle as ApiVehicle, Route as ApiRoute } from "@/types";
import { vehicleScheduleApi } from "@/modules/vehicle-schedules/services/vehicleScheduleApi";
import { vehicleTicketBookingApi } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import { locationApi } from "@/modules/locations/services/locationApi";
import { superSettingApi } from "@/modules/settings/services/superSettingApi";
import AppBar from "@/components/app/AppBar";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
function imageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
}

type DriverState = "no_vehicle" | "no_route" | "route_selected" | "trip_started";

function vehicleToVehicleInfo(v: ApiVehicle): VehicleInfo {
  const driver = v.active_driver_details ?? v.driver_details?.[0];
  return {
    id: v.id,
    name: v.name,
    phone: driver?.phone ?? "",
    images: v.images?.map((i) => i.image) ?? [],
    plateNumber: v.vehicle_no,
    type: v.vehicle_type,
  };
}

/** Parse flat seat_layout (e.g. ["x","-","-","y",":","x","-","x","x",":"]) into rows.
 * ":" = new row, x = seat, y = driver, - = empty.
 */
function parseSeatLayout(seatLayout: string[] | undefined): string[][] {
  if (!seatLayout || !Array.isArray(seatLayout) || seatLayout.length === 0) {
    return [];
  }
  const rows: string[][] = [];
  let currentRow: string[] = [];
  for (const cell of seatLayout) {
    if (cell === ":") {
      if (currentRow.length) {
        rows.push(currentRow);
        currentRow = [];
      }
    } else {
      currentRow.push(String(cell));
    }
  }
  if (currentRow.length) rows.push(currentRow);
  return rows;
}

/** Build Seat[] from seat_layout array (x = seat, y = driver, - = empty, : = new row). */
function buildSeatsFromLayout(layout: string[]): Seat[] {
  const rows = parseSeatLayout(layout);
  if (rows.length === 0) return [];
  const sides = "ABCDEFGHIJ".split("");
  const result: Seat[] = [];
  for (let ri = 0; ri < rows.length; ri++) {
    let numInRow = 0;
    const row = rows[ri];
    const side = sides[ri] ?? String.fromCharCode(65 + ri);
    for (let ci = 0; ci < row.length; ci++) {
      const cell = row[ci];
      if (cell === "x") {
        numInRow += 1;
        const label = `${side}${numInRow}`;
        result.push({
          id: label,
          label,
          row: ri,
          col: ci,
          status: "available",
        });
      } else if (cell === "y") {
        result.push({
          id: "DR",
          label: "Driver",
          row: ri,
          col: ci,
          status: "driver",
        });
      }
    }
  }
  return result;
}

const DEFAULT_SEATS_WHEN_NO_LAYOUT: Seat[] = [
  { id: "A1", label: "A1", row: 0, col: 0, status: "available" },
  { id: "DR", label: "Driver", row: 0, col: 3, status: "driver" },
  { id: "A2", label: "A2", row: 1, col: 0, status: "available" },
  { id: "B1", label: "B1", row: 1, col: 2, status: "available" },
  { id: "B2", label: "B2", row: 1, col: 3, status: "available" },
];

function buildSeatsFromVehicle(vehicle: ApiVehicle | null, fallbackLayout?: string[]): Seat[] {
  const layout = vehicle?.seat_layout?.length ? vehicle.seat_layout : fallbackLayout;

  if (layout?.length) {
    const seats = buildSeatsFromLayout(layout);
    if (seats.length > 0 && vehicle?.seats?.length) {
      const seatById = new Map(
        vehicle.seats
          .filter((s) => s.side !== undefined)
          .map((s) => [`${s.side}${s.number}`, s])
      );
      return seats.map((seat) => {
        if (seat.status === "driver") return seat;
        const apiSeat = seatById.get(seat.id);
        return {
          ...seat,
          status: (apiSeat?.status === "booked" ? "booked" : "available") as Seat["status"],
        };
      });
    }
    return seats;
  }

  if (vehicle?.seats?.length) {
    const driverSeat = { id: "DR", label: "Driver", row: 0, col: 3, status: "driver" as const };
    const seats: Seat[] = vehicle.seats
      .filter((s) => s.side !== undefined)
      .map((s, i) => ({
        id: `${s.side}${s.number}`,
        label: `${s.side}${s.number}`,
        row: Math.floor(i / 4),
        col: i % 4,
        status: (s.status === "booked" ? "booked" : "available") as Seat["status"],
      }));
    return [driverSeat, ...seats];
  }

  return DEFAULT_SEATS_WHEN_NO_LAYOUT;
}

export default function Vehicle() {
  const { user } = useAuth();
  const [driverState, setDriverState] = useState<DriverState>("no_vehicle");
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<ApiVehicle | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showVehicleDetailModal, setShowVehicleDetailModal] = useState(false);
  const [showScheduledConfirmModal, setShowScheduledConfirmModal] = useState(false);
  const [scheduledConfirmData, setScheduledConfirmData] = useState<TripStartConfirmScheduled | null>(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchStep, setSwitchStep] = useState<"select" | "confirm">("select");
  const [switchTarget, setSwitchTarget] = useState<Seat | null>(null);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [showEndTripOutOfRangeModal, setShowEndTripOutOfRangeModal] = useState(false);
  const [pendingEndTripLocation, setPendingEndTripLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [showRouteConfirmModal, setShowRouteConfirmModal] = useState(false);
  const [routeToConfirm, setRouteToConfirm] = useState<RouteInfo | null>(null);
  const [showScanConfirmModal, setShowScanConfirmModal] = useState(false);
  const [vehicleToConnect, setVehicleToConnect] = useState<ApiVehicle | null>(null);
  const [pendingVehicleId, setPendingVehicleId] = useState<string | null>(null);
  const [isSettingRoute, setIsSettingRoute] = useState(false);
  const [tripTab, setTripTab] = useState<"seats" | "map">("seats");
  const [scheduleBookings, setScheduleBookings] = useState<Array<{ pnr: string; name: string; seat: string; price: string }>>([]);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number; speed?: number } | null>(null);
  const [mapInitialCenter, setMapInitialCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [superSettingSeatLayout, setSuperSettingSeatLayout] = useState<string[] | null>(null);
  const prevLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const NEPAL_CENTER = { lat: 27.7172, lng: 85.324 };

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.id) {
          const [myActiveRes, vehiclesRes, routesRes] = await Promise.all([
            vehicleApi.getMyActiveVehicle(),
            vehicleApi.list({ driver: user.id, per_page: 100 }),
            routeApi.list({ per_page: 100 }),
          ]);
          setVehicles(vehiclesRes.results);
          setRoutes(routesRes.results.map(routeToRouteInfo));
          if (myActiveRes) {
            setSelectedVehicle(myActiveRes);
            let fallbackLayout: string[] | undefined;
            if (!myActiveRes.seats?.length && !myActiveRes.seat_layout?.length) {
              try {
                const settingsRes = await superSettingApi.list({ per_page: 1 });
                const layout = settingsRes.results?.[0]?.seat_layout;
                fallbackLayout = Array.isArray(layout) ? layout : undefined;
                if (fallbackLayout?.length) setSuperSettingSeatLayout(fallbackLayout);
              } catch {
                fallbackLayout = undefined;
              }
            }
            setSeats(buildSeatsFromVehicle(myActiveRes, fallbackLayout));
            const routeInfo = myActiveRes.active_route_details
              ? routeToRouteInfo(myActiveRes.active_route_details as ApiRoute)
              : null;
            if (routeInfo) setSelectedRoute(routeInfo);
            const at = myActiveRes.active_trip as ActiveTrip | null | undefined;
            if (at?.id && at.start_time && !at.end_time) {
              setActiveTrip(at);
              setDriverState("trip_started");
            } else if (routeInfo) {
              setDriverState("route_selected");
            } else {
              setDriverState("no_route");
            }
          }
        }
      } catch {
        setVehicles([]);
        setRoutes([]);
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedVehicle?.id || driverState !== "route_selected") return;
    const today = new Date().toISOString().slice(0, 10);
    vehicleScheduleApi.list({ vehicle: selectedVehicle.id, date: today, per_page: 5 })
      .then((r) => {
        const scheduleIds = (r.results ?? []).map((s) => s.id);
        if (scheduleIds.length === 0) {
          setScheduleBookings([]);
          return;
        }
        return Promise.all(scheduleIds.map((id) => vehicleTicketBookingApi.list({ vehicle_schedule: id, per_page: 50 })));
      })
      .then((results) => {
        if (!results) return;
        const list: Array<{ pnr: string; name: string; seat: string; price: string }> = [];
        results.forEach((res) => {
          (res.results ?? []).forEach((b) => {
            const seatStr = Array.isArray(b.seat)
              ? (b.seat as { side: string; number: number }[]).map((s) => `${s.side}${s.number}`).join(", ")
              : typeof b.seat === "object" && b.seat && "side" in b.seat
                ? `${(b.seat as { side: string }).side}${(b.seat as { number: number }).number}`
                : "";
            list.push({ pnr: b.pnr, name: b.name, seat: seatStr, price: String(b.price) });
          });
        });
        setScheduleBookings(list);
      })
      .catch(() => setScheduleBookings([]));
  }, [selectedVehicle?.id, driverState]);

  useEffect(() => {
    if (!activeTrip?.id || driverState !== "trip_started") return;
    const interval = setInterval(() => {
      locationApi.list({ trip: activeTrip.id, per_page: 1 })
        .then((r) => {
          const loc = r.results?.[0];
          if (loc) {
            const next = { lat: Number(loc.latitude), lng: Number(loc.longitude), speed: loc.speed ? Number(loc.speed) : undefined };
            setLastLocation((prev) => {
              if (prev) prevLocationRef.current = { lat: prev.lat, lng: prev.lng };
              return next;
            });
          }
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTrip?.id, driverState]);

  useEffect(() => {
    if (driverState !== "trip_started" || tripTab !== "map") return;
    if (lastLocation) return;
    getCurrentLocation()
      .then((loc) => {
        setLastLocation({ lat: loc.lat, lng: loc.lng });
        setMapInitialCenter(loc);
      })
      .catch(() => setMapInitialCenter(NEPAL_CENTER));
  }, [driverState, tripTab, lastLocation]);

  const vehicleInfo = selectedVehicle ? vehicleToVehicleInfo(selectedVehicle) : null;
  const bookedSelected = selectedSeats.filter((s) => s.status === "booked");
  const availableSelected = selectedSeats.filter((s) => s.status === "available");
  const singleBookedSelected = bookedSelected.length === 1 && availableSelected.length === 0;

  const handleScan = async () => {
    if (isFlutterBridgeAvailable()) {
      setIsScanning(true);
      try {
        const result = await requestNativeScan();
        if (result.success && result.vehicleId) {
          const vehicleId = result.vehicleId.trim();
          try {
            const vehicleDetails = await vehicleApi.get(vehicleId);
            setVehicleToConnect(vehicleDetails);
            setPendingVehicleId(vehicleId);
            setShowScanConfirmModal(true);
          } catch {
            toast.error("Vehicle not found or you don't have access.");
          }
        } else if (!result.success && result.error) {
          toast.error(result.error);
        }
      } catch (e) {
        toast.error("Failed to connect vehicle");
      } finally {
        setIsScanning(false);
      }
      return;
    }
    if (vehicles.length > 0) {
      setSelectedVehicle(vehicles[0]);
      setSeats(buildSeatsFromVehicle(vehicles[0], superSettingSeatLayout ?? undefined));
      setDriverState("no_route");
    } else {
      toast.info("No vehicle assigned. Contact admin.");
    }
  };

  const handleConfirmScanConnect = async () => {
    if (!pendingVehicleId) return;
    setIsScanning(true);
    try {
      const vehicle = await vehicleApi.connectVehicle(pendingVehicleId);
      setSelectedVehicle(vehicle);
      setSeats(buildSeatsFromVehicle(vehicle, superSettingSeatLayout ?? undefined));
      setDriverState("no_route");
      setShowScanConfirmModal(false);
      setVehicleToConnect(null);
      setPendingVehicleId(null);
      toast.success("Vehicle connected!");
    } catch (e) {
      toast.error("Failed to connect vehicle");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectRoute = (route: RouteInfo) => {
    setRouteToConfirm(route);
    setShowRouteConfirmModal(true);
  };

  const handleConfirmRouteSelect = async () => {
    if (!selectedVehicle?.id || !routeToConfirm) return;
    setIsSettingRoute(true);
    try {
      const updatedVehicle = await vehicleApi.setActiveRoute(selectedVehicle.id, routeToConfirm.id);
      setSelectedVehicle(updatedVehicle);
      setSelectedRoute(routeToConfirm);
      setDriverState("route_selected");
      setShowRouteModal(false);
      setShowRouteConfirmModal(false);
      setRouteToConfirm(null);
      toast.success("Active route set successfully");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      toast.error(err?.response?.data?.error ?? err?.message ?? "Failed to set active route");
    } finally {
      setIsSettingRoute(false);
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    if (isFlutterBridgeAvailable()) {
      return requestLocation().then((r) =>
        r.success && r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : Promise.reject(new Error(r.error || "No location"))
      );
    }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleStartTrip = async () => {
    if (!selectedVehicle?.id) return;
    try {
      const loc = await getCurrentLocation();
      const res = await tripApi.startTrip(selectedVehicle.id, { latitude: loc.lat, longitude: loc.lng });
      if ("need_confirm_scheduled" in res && res.need_confirm_scheduled) {
        setScheduledConfirmData(res);
        setShowScheduledConfirmModal(true);
        return;
      }
      const trip = res as ActiveTrip & { vehicle?: string; driver?: string; route?: string };
      setActiveTrip({ id: trip.id, trip_id: trip.trip_id, start_time: trip.start_time ?? null, end_time: trip.end_time ?? null });
      setDriverState("trip_started");
      if (selectedVehicle?.id) startLocationStream(trip.id, selectedVehicle.id, 30);
      toast.success("Trip started!");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      toast.error(err?.response?.data?.error ?? err?.message ?? "Failed to start trip");
    }
  };

  const handleConfirmScheduledStart = async () => {
    if (!selectedVehicle?.id || !scheduledConfirmData?.schedule?.id) return;
    setShowScheduledConfirmModal(false);
    try {
      const res = await tripApi.startTrip(selectedVehicle.id, { vehicle_schedule_id: scheduledConfirmData.schedule.id });
      const trip = res as ActiveTrip & { vehicle?: string; driver?: string; route?: string };
      setActiveTrip({ id: trip.id, trip_id: trip.trip_id, start_time: trip.start_time ?? null, end_time: trip.end_time ?? null });
      setDriverState("trip_started");
      setScheduledConfirmData(null);
      if (selectedVehicle?.id) startLocationStream(trip.id, selectedVehicle.id, 30);
      toast.success("Scheduled trip started!");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? "Failed to start scheduled trip");
    }
  };

  const handleStartNormalTrip = async () => {
    setShowScheduledConfirmModal(false);
    setScheduledConfirmData(null);
    if (!selectedVehicle?.id) return;
    try {
      const trip = await tripApi.startTrip(selectedVehicle.id);
      const t = trip as ActiveTrip & { vehicle?: string; driver?: string; route?: string };
      setActiveTrip({ id: t.id, trip_id: t.trip_id, start_time: t.start_time ?? null, end_time: t.end_time ?? null });
      setDriverState("trip_started");
      if (selectedVehicle?.id) startLocationStream(t.id, selectedVehicle.id, 30);
      toast.success("Trip started!");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? "Failed to start trip");
    }
  };

  const confirmCheckIn = () => {
    const updatedSeats = seats.map((s) => {
      if (availableSelected.some((sel) => sel.id === s.id)) {
        return { ...s, status: "booked" as const, passengerName: "Walk-in" };
      }
      return s;
    });
    setSeats(updatedSeats);
    setSelectedSeats([]);
    setShowCheckinModal(false);
    toast.success("Check-in successful!");
  };

  const confirmCheckOut = () => {
    const updatedSeats = seats.map((s) => {
      if (bookedSelected.some((sel) => sel.id === s.id)) {
        return { ...s, status: "available" as const, passengerName: undefined, bookingId: undefined };
      }
      return s;
    });
    setSeats(updatedSeats);
    setSelectedSeats([]);
    setShowCheckoutModal(false);
    toast.success("Check-out successful!");
  };

  const confirmSwitch = () => {
    if (!switchTarget || bookedSelected.length !== 1) return;
    const source = bookedSelected[0];
    const updatedSeats = seats.map((s) => {
      if (s.id === source.id) return { ...s, status: "available" as const, passengerName: undefined, bookingId: undefined };
      if (s.id === switchTarget.id) return { ...s, status: "booked" as const, passengerName: source.passengerName, bookingId: source.bookingId };
      return s;
    });
    setSeats(updatedSeats);
    setSelectedSeats([]);
    setSwitchTarget(null);
    setShowSwitchModal(false);
    toast.success("Seat switched!");
  };

  const confirmEndTrip = () => {
    setShowEndTripModal(false);
    if (!activeTrip?.id) {
      stopLocationStream();
      setDriverState("route_selected");
      setActiveTrip(null);
setSeats(buildSeatsFromVehicle(selectedVehicle, superSettingSeatLayout ?? undefined));
        return;
    }
    setIsEndingTrip(true);
    getCurrentLocation()
      .then((loc) => {
        setPendingEndTripLocation(loc);
        return tripApi.endTrip(activeTrip.id, { latitude: loc.lat, longitude: loc.lng });
      })
      .then((res) => {
        if (res.within_destination === false) {
          setShowEndTripOutOfRangeModal(true);
          return;
        }
        stopLocationStream();
        setDriverState("route_selected");
        setActiveTrip(null);
        setPendingEndTripLocation(null);
        setSeats(buildSeatsFromVehicle(selectedVehicle, superSettingSeatLayout ?? undefined));
        setShowEndTripOutOfRangeModal(false);
        toast.success("Trip ended!");
      })
      .catch((e) => {
        toast.error(e?.message ?? "Failed to get location or end trip");
      })
      .finally(() => setIsEndingTrip(false));
  };

  const confirmEndTripOutOfRange = async () => {
    if (!activeTrip?.id || !pendingEndTripLocation) return;
    setIsEndingTrip(true);
    try {
      await tripApi.endTrip(activeTrip.id, {
        latitude: pendingEndTripLocation.lat,
        longitude: pendingEndTripLocation.lng,
        confirm_out_of_range: true,
      });
      stopLocationStream();
      setDriverState("route_selected");
      setActiveTrip(null);
      setPendingEndTripLocation(null);
      setSeats(buildSeatsFromVehicle(selectedVehicle, superSettingSeatLayout ?? undefined));
      setShowEndTripOutOfRangeModal(false);
      toast.success("Trip ended.");
    } catch {
      toast.error("Failed to end trip");
    } finally {
      setIsEndingTrip(false);
    }
  };

  const currentLocationPoint = lastLocation
    ? { name: "Current Location", lat: lastLocation.lat, lng: lastLocation.lng, type: "current" as const }
    : mapInitialCenter
      ? { name: "Current Location", lat: mapInitialCenter.lat, lng: mapInitialCenter.lng, type: "current" as const }
      : { name: "Current Location", lat: NEPAL_CENTER.lat, lng: NEPAL_CENTER.lng, type: "current" as const };
  const currentLocation: MapPoint = currentLocationPoint;

  if (driverState === "no_vehicle") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-24 h-24 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-6">
            <QrCode size={48} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold mb-2">Connect Your Vehicle</h2>
          <p className="text-sm text-muted-foreground mb-8">Scan QR code on your vehicle or use your assigned vehicle</p>
          <Button onClick={handleScan} className="h-12 px-8 rounded-xl text-base font-semibold" disabled={isScanning}>
            <QrCode size={18} className="mr-2" /> {isScanning ? "Opening scanner…" : isFlutterBridgeAvailable() ? "Scan & Connect" : vehicles.length > 0 ? "Use My Vehicle" : "Scan & Connect"}
          </Button>
        </motion.div>
        <Dialog open={showScanConfirmModal} onOpenChange={(open) => { if (!open) { setShowScanConfirmModal(false); setVehicleToConnect(null); setPendingVehicleId(null); } }}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Confirm vehicle</DialogTitle>
              <DialogDescription>Connect as active driver to this vehicle?</DialogDescription>
            </DialogHeader>
            {vehicleToConnect && (
              <div className="space-y-3 py-2">
                <div className="app-glass-card rounded-xl p-4 border border-border/50">
                  <p className="font-semibold">{vehicleToConnect.name}</p>
                  <p className="text-sm text-muted-foreground">{vehicleToConnect.vehicle_no}</p>
                  <p className="text-xs text-muted-foreground">Type: {vehicleToConnect.vehicle_type}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowScanConfirmModal(false); setVehicleToConnect(null); setPendingVehicleId(null); }}>Cancel</Button>
                  <Button className="flex-1" onClick={handleConfirmScanConnect} disabled={isScanning}>Connect</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (driverState === "no_route" && vehicleInfo && selectedVehicle) {
    const activeRouteDetails = selectedVehicle.active_route_details as ApiRoute | undefined;
    const vehicleRoutes = selectedVehicle.routes?.length
      ? routes.filter((r) => selectedVehicle!.routes!.includes(r.id))
      : routes;
    return (
      <div className="min-h-screen">
        <AppBar title="Vehicle" />
        <div className="px-5 pt-4">
        <h2 className="text-lg font-bold mb-4">Your Vehicle</h2>
        <button type="button" className="w-full text-left" onClick={() => setShowVehicleDetailModal(true)}>
          <VehicleCard vehicle={vehicleInfo} />
        </button>

        <h3 className="text-sm font-bold mt-6 mb-3">Select Route</h3>
        <div className="space-y-3">
          {vehicleRoutes.map((route) => (
            <RouteCard key={route.id} route={route} onSelect={() => handleSelectRoute(route)} showMap />
          ))}
          {vehicleRoutes.length === 0 && <p className="text-sm text-muted-foreground">No routes available for this vehicle</p>}
        </div>
        </div>
        <Dialog open={showVehicleDetailModal} onOpenChange={setShowVehicleDetailModal}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>{selectedVehicle.name} · {selectedVehicle.vehicle_no}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {(selectedVehicle.images?.length ? selectedVehicle.images : []).map((img, i) => (
                <img key={i} src={imageUrl(typeof img === "object" ? (img as { image?: string }).image : img)} alt="" className="w-full h-40 object-cover rounded-xl border" />
              ))}
              {activeRouteDetails && (
                <div className="app-glass-card rounded-xl p-4 border border-border/50">
                  <h4 className="font-semibold text-sm mb-2">Active route</h4>
                  <RouteCard route={routeToRouteInfo(activeRouteDetails)} showMap />
                </div>
              )}
              <p className="text-xs text-muted-foreground">Type: {selectedVehicle.vehicle_type}</p>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showRouteConfirmModal} onOpenChange={(open) => { if (!open) { setShowRouteConfirmModal(false); setRouteToConfirm(null); } }}>
          <DialogContent className="max-w-[380px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Set active route?</DialogTitle>
              <DialogDescription>This route will be set as the active route for your vehicle.</DialogDescription>
            </DialogHeader>
            {routeToConfirm && (
              <div className="space-y-3 py-2">
                <RouteCard route={routeToConfirm} showMap />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowRouteConfirmModal(false); setRouteToConfirm(null); }}>Cancel</Button>
                  <Button className="flex-1" onClick={handleConfirmRouteSelect} disabled={isSettingRoute}>{isSettingRoute ? "Setting…" : "Confirm"}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (driverState === "route_selected" && selectedRoute && vehicleInfo) {
    const hasActiveTrip = !!selectedVehicle?.active_trip?.id && selectedVehicle?.active_trip?.start_time && !selectedVehicle?.active_trip?.end_time;
    return (
      <div className="min-h-screen">
        <AppBar title="Vehicle" />
        <div className="px-5 pt-4">
        <VehicleCard vehicle={vehicleInfo} compact />
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold">Active Route</h3>
            {!hasActiveTrip && (
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => setShowRouteModal(true)}>
                <RotateCcw size={12} className="mr-1" /> Change
              </Button>
            )}
          </div>
          <RouteCard route={selectedRoute} active showMap />
        </div>
        <div className="mt-6">
          <SwipeButton label="Swipe to Start Trip →" onSwipe={handleStartTrip} />
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-bold mb-3">Seat Bookings</h3>
          {scheduleBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No scheduled bookings for today</p>
          ) : (
            scheduleBookings.map((b, i) => (
              <div key={b.pnr + i} className="app-glass-card rounded-xl p-4 border border-border/50 mb-2">
                <p className="font-medium text-sm">{b.pnr} · {b.name}</p>
                <p className="text-xs text-muted-foreground">Seat(s): {b.seat} · Rs. {b.price}</p>
              </div>
            ))
          )}
        </div>
        </div>
        <Dialog open={showScheduledConfirmModal} onOpenChange={(open) => !open && setScheduledConfirmData(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Start scheduled trip?</DialogTitle>
            </DialogHeader>
            {scheduledConfirmData && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {scheduledConfirmData.schedule.route_name} · {scheduledConfirmData.schedule.date} {scheduledConfirmData.schedule.time}
                </p>
                <p className="text-xs">Tickets: {scheduledConfirmData.tickets.length}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowScheduledConfirmModal(false)}>Cancel</Button>
                  <Button variant="outline" className="flex-1" onClick={handleStartNormalTrip}>Start normal trip</Button>
                  <Button className="flex-1" onClick={handleConfirmScheduledStart}>Confirm and Start</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={showRouteModal} onOpenChange={setShowRouteModal}>
          <DialogContent className="max-w-[380px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base">Change Route</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {(selectedVehicle?.routes?.length ? routes.filter((r) => selectedVehicle!.routes!.includes(r.id)) : routes).map((route) => (
                <RouteCard key={route.id} route={route} onSelect={() => handleSelectRoute(route)} active={selectedRoute?.id === route.id} showMap />
              ))}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showRouteConfirmModal} onOpenChange={(open) => { if (!open) { setShowRouteConfirmModal(false); setRouteToConfirm(null); } }}>
          <DialogContent className="max-w-[380px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Set active route?</DialogTitle>
              <DialogDescription>This route will be set as the active route for your vehicle.</DialogDescription>
            </DialogHeader>
            {routeToConfirm && (
              <div className="space-y-3 py-2">
                <RouteCard route={routeToConfirm} showMap />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowRouteConfirmModal(false); setRouteToConfirm(null); }}>Cancel</Button>
                  <Button className="flex-1" onClick={handleConfirmRouteSelect} disabled={isSettingRoute}>{isSettingRoute ? "Setting…" : "Confirm"}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const tripMapPoints: MapPoint[] = [
    ...(selectedRoute ? [{
      name: selectedRoute.startPoint?.name ?? "Start",
      lat: selectedRoute.startPoint?.lat ?? 0,
      lng: selectedRoute.startPoint?.lng ?? 0,
      type: "start" as const,
    }] : []),
    ...(selectedRoute?.stops ?? []).map((s) => ({ name: s.name, lat: s.lat, lng: s.lng, type: "stop" as const })),
    ...(selectedRoute ? [{
      name: selectedRoute.endPoint?.name ?? "End",
      lat: selectedRoute.endPoint?.lat ?? 0,
      lng: selectedRoute.endPoint?.lng ?? 0,
      type: "end" as const,
    }] : []),
  ];
  if (lastLocation) {
    tripMapPoints.push({ name: "Vehicle", lat: lastLocation.lat, lng: lastLocation.lng, type: "current" });
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppBar title={selectedVehicle ? `${selectedVehicle.vehicle_no} · ${selectedVehicle.name}` : "Trip"} />
      <div className="flex gap-2 px-4 pt-3 border-b border-border bg-background/80 backdrop-blur shrink-0">
        <button
          type="button"
          onClick={() => setTripTab("seats")}
          className={`flex-1 py-2.5 rounded-t-xl font-medium text-sm ${tripTab === "seats" ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}
        >
          Seats
        </button>
        <button
          type="button"
          onClick={() => setTripTab("map")}
          className={`flex-1 py-2.5 rounded-t-xl font-medium text-sm ${tripTab === "map" ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}
        >
          Map
        </button>
      </div>
      <div className={`px-4 pt-4 pb-24 flex-1 flex flex-col min-h-0 ${tripTab === "map" ? "overflow-hidden" : "overflow-auto"}`}>
      {tripTab === "seats" && (
        <>
      <SeatLayout seats={seats} selectedSeats={selectedSeats} onSeatSelect={setSelectedSeats} size="large" />

      {selectedSeats.length > 0 && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 space-y-2">
          {availableSelected.length > 0 && (
            <Button onClick={() => setShowCheckinModal(true)} className="w-full h-11 rounded-xl font-semibold">
              Check In ({availableSelected.length} seat{availableSelected.length > 1 ? "s" : ""})
            </Button>
          )}
          {bookedSelected.length > 0 && (
            <Button onClick={() => setShowCheckoutModal(true)} variant="outline" className="w-full h-11 rounded-xl font-semibold">
              Check Out ({bookedSelected.length} seat{bookedSelected.length > 1 ? "s" : ""})
            </Button>
          )}
          {singleBookedSelected && (
            <Button onClick={() => { setSwitchStep("select"); setShowSwitchModal(true); }} variant="outline" className="w-full h-11 rounded-xl font-semibold">
              Switch Seat
            </Button>
          )}
        </motion.div>
      )}

      <div className="mt-8 mb-4">
        <SwipeButton label="Swipe to End Trip →" onSwipe={() => setShowEndTripModal(true)} variant="destructive" />
      </div>
        </>
      )}
      {tripTab === "map" && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {lastLocation && (
            <p className="text-sm text-muted-foreground shrink-0">
              Speed: {lastLocation.speed != null ? `${Number(lastLocation.speed).toFixed(0)} km/h` : "—"}
            </p>
          )}
          {(() => {
            const navCenter = lastLocation ?? mapInitialCenter ?? NEPAL_CENTER;
            const navCenterPoint = { lat: navCenter.lat, lng: navCenter.lng };
            const routeWaypoints: Array<{ lat: number; lng: number }> = selectedRoute
              ? [
                  ...(selectedRoute.startPoint ? [{ lat: selectedRoute.startPoint.lat, lng: selectedRoute.startPoint.lng }] : []),
                  ...(selectedRoute.stops ?? []).map((s) => ({ lat: s.lat, lng: s.lng })),
                  ...(selectedRoute.endPoint ? [{ lat: selectedRoute.endPoint.lat, lng: selectedRoute.endPoint.lng }] : []),
                ].filter((p) => p.lat !== 0 || p.lng !== 0)
              : [];
            const routeMarkers = tripMapPoints.filter(
              (p): p is MapPoint & { type: "start" | "stop" | "end" } => p.type !== "current"
            );
            return (
              <DriverNavigationMap
                center={navCenterPoint}
                previousCenter={prevLocationRef.current}
                routeWaypoints={routeWaypoints.length >= 2 ? routeWaypoints : []}
                routeMarkers={routeMarkers}
                className="flex-1 min-h-0 rounded-2xl border border-border"
              />
            );
          })()}
        </div>
      )}

      <ConfirmModal open={showCheckinModal} onClose={() => setShowCheckinModal(false)} onConfirm={confirmCheckIn} title="Confirm Check-In" description={`Check in ${availableSelected.length} passenger(s)?`} confirmLabel="Check In" />
      <ConfirmModal open={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} onConfirm={confirmCheckOut} title="Confirm Check-Out" confirmLabel="Check Out">
        <MiniMap points={[currentLocation]} className="mb-3" />
      </ConfirmModal>

      <Dialog open={showSwitchModal} onOpenChange={setShowSwitchModal}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{switchStep === "select" ? "Select New Seat" : "Confirm Switch"}</DialogTitle>
          </DialogHeader>
          {switchStep === "select" ? (
            <div>
              <p className="text-xs text-muted-foreground mb-3">Switch {bookedSelected[0]?.label} to an available seat:</p>
              <div className="grid grid-cols-4 gap-2">
                {seats.filter((s) => s.status === "available").map((s) => (
                  <button key={s.id} type="button" onClick={() => { setSwitchTarget(s); setSwitchStep("confirm"); }} className="seat-available rounded-xl p-3 text-center">
                    <span className="text-xs font-bold">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">Switch <strong>{bookedSelected[0]?.label}</strong> → <strong>{switchTarget?.label}</strong>?</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowSwitchModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={confirmSwitch}>Confirm</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal open={showEndTripModal} onClose={() => setShowEndTripModal(false)} onConfirm={confirmEndTrip} title="End Trip?" description="Are you sure you want to end this trip?" confirmLabel="End Trip" variant="destructive" />
      <ConfirmModal open={showEndTripOutOfRangeModal} onClose={() => { setShowEndTripOutOfRangeModal(false); setPendingEndTripLocation(null); setIsEndingTrip(false); }} onConfirm={confirmEndTripOutOfRange} title="Not at destination" description="You are not at the proper destination. Are you sure you want to end the trip?" confirmLabel="Yes, end trip" variant="destructive" />
      </div>
    </div>
  );
}
