import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Search, Users, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VehicleCard from "@/components/app/VehicleCard";
import type { VehicleInfo } from "@/components/app/VehicleCard";
import RouteCard from "@/components/app/RouteCard";
import type { RouteInfo } from "@/components/app/RouteCard";
import { vehicleApi } from "@/modules/vehicles/services/vehicleApi";
import { routeApi } from "@/modules/routes/services/routeApi";
import { routeToRouteInfo } from "@/lib/routeMap";
import { Vehicle as ApiVehicle } from "@/types";

interface AvailableVehicle {
  vehicle: VehicleInfo;
  route: RouteInfo;
  availableSeats: number;
  fare: number;
}

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

export default function UserBooking() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<AvailableVehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searched) return;
    const search = async () => {
      setLoading(true);
      try {
        const [vehiclesRes, routesRes] = await Promise.all([
          vehicleApi.list({ per_page: 50, is_active: true }),
          routeApi.list({ per_page: 100 }),
        ]);
        const routeInfos = routesRes.results.map(routeToRouteInfo);
        const list: AvailableVehicle[] = [];
        vehiclesRes.results.forEach((v) => {
          const routeDetails = v.active_route_details ?? v.route_details?.[0];
          if (routeDetails) {
            const routeInfo = routeToRouteInfo(routeDetails);
            const seatCount = v.seats?.filter((s) => s.status === "available").length ?? 0;
            list.push({
              vehicle: vehicleToVehicleInfo(v),
              route: routeInfo,
              availableSeats: seatCount || 5,
              fare: 150,
            });
          }
        });
        setResults(list);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [searched]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <div className="min-h-screen px-5 pt-6">
      <h2 className="text-lg font-bold mb-4">Book a Ride</h2>

      <form onSubmit={handleSearch} className="space-y-3 mb-6">
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
          <Input placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-10 h-12 rounded-xl" />
        </div>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-destructive" />
          <Input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} className="pl-10 h-12 rounded-xl" />
        </div>
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-10 h-12 rounded-xl" />
        </div>
        <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading}>
          <Search size={16} className="mr-2" /> {loading ? "Searching..." : "Search Vehicles"}
        </Button>
      </form>

      <AnimatePresence>
        {searched && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h3 className="text-sm font-bold">{results.length} Vehicles Available</h3>
            {results.map((result) => (
              <motion.div
                key={result.vehicle.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="app-surface border border-border rounded-2xl p-4 space-y-3"
              >
                <VehicleCard vehicle={result.vehicle} compact />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users size={12} className="text-primary" />
                    <span>{result.availableSeats} seats</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="font-bold text-foreground text-sm">Rs. {result.fare}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-primary">{result.route.startPoint.name}</span>
                  <span className="mx-1">→</span>
                  {result.route.stops.length > 0 && <span>{result.route.stops.length} stops → </span>}
                  <span className="text-destructive">{result.route.endPoint.name}</span>
                </div>
                <Button className="w-full h-10 rounded-xl text-sm font-semibold">
                  Book Now <ArrowRight size={14} className="ml-1" />
                </Button>
              </motion.div>
            ))}
            {results.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground py-4">No vehicles available for this search.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
