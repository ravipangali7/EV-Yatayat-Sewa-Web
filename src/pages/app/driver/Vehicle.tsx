import { useState, useEffect } from "react";
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
import TransactionCard from "@/components/app/TransactionCard";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleApi } from "@/modules/vehicles/services/vehicleApi";
import { routeApi } from "@/modules/routes/services/routeApi";
import { routeToRouteInfo } from "@/lib/routeMap";
import { isAvailable as isFlutterBridgeAvailable, requestScan as requestNativeScan } from "@/lib/flutterBridge";
import { Vehicle as ApiVehicle, Route as ApiRoute } from "@/types";
import { toast } from "sonner";

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

function buildSeatsFromVehicle(vehicle: ApiVehicle | null): Seat[] {
  if (!vehicle?.seats?.length) {
    return [
      { id: "A1", label: "A1", row: 0, col: 0, status: "available" },
      { id: "DR", label: "Driver", row: 0, col: 3, status: "driver" },
      { id: "A2", label: "A2", row: 1, col: 0, status: "available" },
      { id: "B1", label: "B1", row: 1, col: 2, status: "available" },
      { id: "B2", label: "B2", row: 1, col: 3, status: "available" },
    ];
  }
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

const mockBookings: AppTransaction[] = [
  { id: "b1", type: "credit", title: "A2 - Passenger", subtitle: "Route", amount: 100, date: "10:30 AM" },
  { id: "b2", type: "credit", title: "B1 - Passenger", subtitle: "Route", amount: 150, date: "10:25 AM" },
];

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
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchStep, setSwitchStep] = useState<"select" | "confirm">("select");
  const [switchTarget, setSwitchTarget] = useState<Seat | null>(null);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

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
            setSeats(buildSeatsFromVehicle(myActiveRes));
            const routeInfo = myActiveRes.active_route_details
              ? routeToRouteInfo(myActiveRes.active_route_details as ApiRoute)
              : null;
            if (routeInfo) {
              setSelectedRoute(routeInfo);
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
          const vehicle = await vehicleApi.connectVehicle(result.vehicleId);
          setSelectedVehicle(vehicle);
          setSeats(buildSeatsFromVehicle(vehicle));
          setDriverState("no_route");
          toast.success("Vehicle connected!");
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
      setSeats(buildSeatsFromVehicle(vehicles[0]));
      setDriverState("no_route");
    } else {
      toast.info("No vehicle assigned. Contact admin.");
    }
  };

  const handleSelectRoute = (route: RouteInfo) => {
    setSelectedRoute(route);
    setDriverState("route_selected");
    setShowRouteModal(false);
  };

  const handleStartTrip = () => {
    setDriverState("trip_started");
    toast.success("Trip started!");
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
    setDriverState("route_selected");
    setShowEndTripModal(false);
    setSeats(buildSeatsFromVehicle(selectedVehicle));
    toast.success("Trip ended!");
  };

  const currentLocation: MapPoint = {
    name: "Current Location",
    lat: 27.695,
    lng: 85.332,
    type: "current",
  };

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
      </div>
    );
  }

  if (driverState === "no_route" && vehicleInfo) {
    return (
      <div className="min-h-screen px-5 pt-6">
        <h2 className="text-lg font-bold mb-4">Your Vehicle</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="vehicle" className="border-none">
            <AccordionTrigger className="p-0 hover:no-underline">
              <VehicleCard vehicle={vehicleInfo} />
            </AccordionTrigger>
            <AccordionContent>
              <div className="mt-3 space-y-2 pl-2">
                <p className="text-xs text-muted-foreground">Phone: {vehicleInfo.phone}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h3 className="text-sm font-bold mt-6 mb-3">Select Route</h3>
        <div className="space-y-3">
          {routes.map((route) => (
            <RouteCard key={route.id} route={route} onSelect={() => handleSelectRoute(route)} showMap />
          ))}
          {routes.length === 0 && <p className="text-sm text-muted-foreground">No routes available</p>}
        </div>
      </div>
    );
  }

  if (driverState === "route_selected" && selectedRoute && vehicleInfo) {
    return (
      <div className="min-h-screen px-5 pt-6">
        <VehicleCard vehicle={vehicleInfo} compact />
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold">Active Route</h3>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => setShowRouteModal(true)}>
              <RotateCcw size={12} className="mr-1" /> Change
            </Button>
          </div>
          <RouteCard route={selectedRoute} active showMap />
        </div>
        <div className="mt-6">
          <SwipeButton label="Swipe to Start Trip →" onSwipe={handleStartTrip} />
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-bold mb-3">Seat Bookings</h3>
          {mockBookings.map((b) => (
            <TransactionCard key={b.id} transaction={b} />
          ))}
        </div>
        <Dialog open={showRouteModal} onOpenChange={setShowRouteModal}>
          <DialogContent className="max-w-[380px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base">Change Route</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {routes.map((route) => (
                <RouteCard key={route.id} route={route} onSelect={() => handleSelectRoute(route)} active={selectedRoute?.id === route.id} showMap />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-4">
      <div className="text-center mb-4">
        <h2 className="text-base font-bold">Trip In Progress</h2>
        <p className="text-xs text-muted-foreground">{selectedRoute?.name}</p>
      </div>

      <SeatLayout seats={seats} selectedSeats={selectedSeats} onSeatSelect={setSelectedSeats} />

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
    </div>
  );
}
