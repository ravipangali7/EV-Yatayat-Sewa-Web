import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { tripApi } from "@/modules/trips/services/tripApi";
import type { ActiveTrip } from "@/modules/trips/services/tripApi";
import { format } from "date-fns";
import { SuccessMark } from "@/components/app/ride/SuccessMark";
import { SvgIcon } from "@/components/app/ride/SvgIcon";
import { ThankYouPanel } from "@/components/app/ride/ThankYouPanel";
import { TripTimeline } from "@/components/app/ride/TripTimeline";

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
    <div className="ride-shell min-h-screen">
      <AppBar title={completed ? "Trip Ended" : "On Trip"} showBack variant="green" />
      <div className="mx-auto w-full max-w-lg space-y-4 px-5 pb-8 pt-6">
        {completed ? (
          <div className="text-center">
            <SuccessMark />
            <h2 className="mt-4 text-2xl font-extrabold text-[#163024]">Trip Ended</h2>
            <p className="text-sm text-[#6D7B74]">Your trip has been completed.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E4EEE8] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F8EC] text-[#1C8C42]">
                <SvgIcon name="bus" className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-[#163024]">{trip.vehicle_details?.name ?? "EV Yatayat"}</p>
                <p className="text-xs text-[#6D7B74]">{trip.vehicle_details?.vehicle_no ?? "EV Microbus"}</p>
              </div>
            </div>
            <TripTimeline
              steps={[
                { title: "Boarded", detail: "Trip started", time: formatTime(trip.start_time), state: "done" },
                { title: "On the way", detail: trip.route_details?.name ?? "Route", state: "current" },
                { title: "Arriving", detail: "Destination", state: "upcoming" },
              ]}
            />
          </div>
        )}

        <div className="flex items-center gap-4 rounded-2xl border border-[#E4EEE8] border-l-4 border-l-[#1C8C42] bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F8EC] text-[#1C8C42]">
            <SvgIcon name="clock" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-bold text-[#163024]">{trip.route_details?.name ?? trip.route ?? "Trip"}</p>
            <p className="text-sm text-[#6D7B74]">{trip.vehicle_details?.vehicle_no ?? trip.vehicle ?? "—"}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${completed ? "bg-[#E7F8EC] text-[#1C8C42]" : "bg-amber-100 text-amber-700"}`}>
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
        {completed && <ThankYouPanel detail="Thank you for driving with EV Yatayat. We look forward to your next trip." />}
      </div>
    </div>
  );
}
