import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { tripApi } from "@/modules/trips/services/tripApi";
import type { ActiveTrip } from "@/modules/trips/services/tripApi";
import { format } from "date-fns";
import { Clock } from "lucide-react";

interface TripDetail extends ActiveTrip {
  vehicle?: string;
  vehicle_details?: { name?: string; vehicle_no?: string };
  route?: string;
  route_details?: { name?: string };
  driver?: string;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

export default function DriverTripHistoryDetail() {
  const { id } = useParams();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    tripApi
      .get(id)
      .then((data) => setTrip(data as TripDetail))
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [id]);

  const formatTime = (s: string | null | undefined) => {
    if (!s) return "—";
    try { return format(new Date(s), "MMM d, yyyy HH:mm:ss"); }
    catch { return s; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar title="Trip Details" showBack />
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar title="Trip Details" showBack />
        <div className="px-5 py-12 text-center text-muted-foreground">Trip not found.</div>
      </div>
    );
  }

  const completed = !!trip.end_time;

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Trip Details" showBack />
      <div className="px-5 pt-6 pb-24 space-y-4">
        <div className="rounded-2xl border border-primary/20 border-l-4 border-l-primary bg-primary/5 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl icon-primary flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="font-bold text-base">{trip.route_details?.name ?? trip.route ?? "Trip"}</p>
            <p className="text-sm text-muted-foreground">{trip.vehicle_details?.vehicle_no ?? trip.vehicle ?? "—"}</p>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${completed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600"}`}>
              {completed ? "Completed" : "In Progress"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trip Info</p>
          <DetailRow label="Trip ID" value={trip.trip_id ?? trip.id} />
          {trip.vehicle_details?.name && <DetailRow label="Vehicle" value={trip.vehicle_details.name} />}
          {trip.vehicle_details?.vehicle_no && <DetailRow label="Vehicle No" value={trip.vehicle_details.vehicle_no} />}
        </div>

        <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Timing</p>
          <DetailRow label="Start Time" value={formatTime(trip.start_time)} />
          <DetailRow label="End Time" value={formatTime(trip.end_time)} />
        </div>
      </div>
    </div>
  );
}
