import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { tripApi } from "@/modules/trips/services/tripApi";
import { format, subDays } from "date-fns";

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

type DatePreset = "7" | "30" | "custom" | "all";

export default function DriverTripHistory() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("30");
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchTrips = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    const params: Parameters<typeof tripApi.list>[0] = {
      driver: user.id,
      per_page: 100,
    };
    if (search.trim()) params.search = search.trim();
    if (datePreset === "7") {
      params.date_from = format(subDays(new Date(), 7), "yyyy-MM-dd");
      params.date_to = format(new Date(), "yyyy-MM-dd");
    } else if (datePreset === "30") {
      params.date_from = format(subDays(new Date(), 30), "yyyy-MM-dd");
      params.date_to = format(new Date(), "yyyy-MM-dd");
    } else if (datePreset === "custom") {
      params.date_from = dateFrom;
      params.date_to = dateTo;
    }
    tripApi
      .list(params)
      .then((res) => setTrips((res.results ?? []) as TripRecord[]))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [user?.id, search, datePreset, dateFrom, dateTo]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const formatTime = (s: string | null | undefined) => {
    if (!s) return "—";
    try {
      return format(new Date(s), "MMM d, yyyy HH:mm");
    } catch {
      return s;
    }
  };

  const duration = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start || !end) return null;
    try {
      const a = new Date(start).getTime();
      const b = new Date(end).getTime();
      const min = Math.round((b - a) / 60000);
      if (min < 60) return `${min}m`;
      return `${Math.floor(min / 60)}h ${min % 60}m`;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Trip History" showBack />
      <div className="px-5 pt-4 pb-24">
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-white dark:bg-card/80 border-border/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["7", "30", "custom", "all"] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  datePreset === preset
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
                }`}
                onClick={() => setDatePreset(preset)}
              >
                {preset === "7" ? "7 days" : preset === "30" ? "30 days" : preset === "custom" ? "Custom" : "All time"}
              </button>
            ))}
            {datePreset === "custom" && (
              <div className="flex items-center gap-1 w-full">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 h-8 text-xs rounded-lg" />
                <span className="text-muted-foreground">–</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 h-8 text-xs rounded-lg" />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Clock size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No trips found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trips.map((trip) => (
              <Link key={trip.id} to={`/app/driver/trip-history/${trip.id}`} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 border-l-4 border-l-primary p-4 hover:border-border hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl icon-primary flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {trip.route_details?.name ?? trip.route ?? "Trip"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {trip.vehicle_details?.vehicle_no ?? trip.vehicle ?? "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {duration(trip.start_time, trip.end_time) && (
                        <p className="text-xs font-semibold text-primary">{duration(trip.start_time, trip.end_time)}</p>
                      )}
                      {!trip.end_time && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">Active</span>}
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 ml-12">
                    {formatTime(trip.start_time)} {trip.end_time ? `→ ${formatTime(trip.end_time)}` : ""}
                  </p>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
