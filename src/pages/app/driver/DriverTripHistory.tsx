import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import AppBar from "@/components/app/AppBar";
import { useAuth } from "@/contexts/AuthContext";
import { tripApi } from "@/modules/trips/services/tripApi";
import { format } from "date-fns";

interface TripRecord {
  id: string;
  trip_id?: string;
  start_time?: string | null;
  end_time?: string | null;
  vehicle?: string;
  vehicle_details?: { name?: string; vehicle_no?: string };
  route?: string;
  route_details?: { name?: string };
  driver?: string;
}

export default function DriverTripHistory() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    tripApi
      .list({ driver: user.id, per_page: 50 })
      .then((res) => setTrips((res.results ?? []) as TripRecord[]))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const formatTime = (s: string | null | undefined) => {
    if (!s) return "—";
    try {
      const d = new Date(s);
      return format(d, "MMM d, yyyy · HH:mm");
    } catch {
      return s;
    }
  };

  return (
    <div className="min-h-screen">
      <AppBar title="Trip History" showBack />
      <div className="px-5 pt-4 pb-24">
        {loading ? (
          <p className="text-sm text-muted-foreground py-8">Loading...</p>
        ) : trips.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8">No trips yet.</p>
        ) : (
          <div className="space-y-2">
            {trips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="app-glass-card rounded-xl p-4 border border-border/50 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {trip.route_details?.name ?? trip.route ?? "Trip"} · {trip.vehicle_details?.vehicle_no ?? trip.vehicle ?? ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(trip.start_time)} {trip.end_time ? `→ ${formatTime(trip.end_time)}` : ""}
                  </p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
