import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { tripApi } from "@/modules/trips/services/tripApi";
import type { ActiveTrip } from "@/modules/trips/services/tripApi";
import { format } from "date-fns";

interface TripDetail extends ActiveTrip {
  vehicle?: string;
  vehicle_details?: { name?: string; vehicle_no?: string };
  route?: string;
  route_details?: { name?: string };
  driver?: string;
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

  if (loading) {
    return (
      <div className="min-h-screen">
        <AppBar title="Trip History" showBack />
        <div className="px-5 py-8 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen">
        <AppBar title="Trip History" showBack />
        <div className="px-5 py-8 text-center text-muted-foreground">Trip not found.</div>
      </div>
    );
  }

  const formatTime = (s: string | null | undefined) => {
    if (!s) return "—";
    try {
      return format(new Date(s), "MMM d, yyyy HH:mm:ss");
    } catch {
      return s;
    }
  };

  return (
    <div className="min-h-screen">
      <AppBar title="Trip Details" showBack />
      <div className="px-5 pt-4 pb-24 space-y-4">
        <div className="app-glass-card rounded-2xl p-4 border border-border/50 space-y-3">
          <h3 className="font-semibold text-sm border-b border-border pb-2">Trip Information</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Trip ID</span>
            <span className="font-medium">{trip.trip_id ?? trip.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">{trip.end_time ? "Completed" : "In progress"}</span>
          </div>
          {(trip as TripDetail).route_details?.name && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium">{(trip as TripDetail).route_details?.name ?? (trip as TripDetail).route ?? "—"}</span>
            </div>
          )}
          {(trip as TripDetail).vehicle_details && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">{(trip as TripDetail).vehicle_details?.name ?? (trip as TripDetail).vehicle ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vehicle No</span>
                <span className="font-medium">{(trip as TripDetail).vehicle_details?.vehicle_no ?? "—"}</span>
              </div>
            </>
          )}
        </div>

        <div className="app-glass-card rounded-2xl p-4 border border-border/50 space-y-3">
          <h3 className="font-semibold text-sm border-b border-border pb-2">Timing</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Start Time</span>
            <span className="font-medium">{formatTime(trip.start_time)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">End Time</span>
            <span className="font-medium">{formatTime(trip.end_time)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
