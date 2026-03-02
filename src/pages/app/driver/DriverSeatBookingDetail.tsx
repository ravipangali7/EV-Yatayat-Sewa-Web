import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { seatBookingApi } from "@/modules/seat-bookings/services/seatBookingApi";
import type { SeatBooking } from "@/types";
import { format } from "date-fns";
import { FileText } from "lucide-react";

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: "green" | "amber" }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold text-right ${accent === "green" ? "text-emerald-600 dark:text-emerald-400" : accent === "amber" ? "text-amber-600" : ""}`}>{value}</span>
    </div>
  );
}

export default function DriverSeatBookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState<SeatBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    seatBookingApi
      .get(id)
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (s: string | undefined) => {
    if (!s) return "—";
    try { return format(new Date(s), "MMM d, yyyy HH:mm"); }
    catch { return s; }
  };

  const latLng = (lat: number | undefined, lng: number | undefined) => {
    if (lat == null || lng == null) return "—";
    return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar title="Booking Details" showBack />
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar title="Booking Details" showBack />
        <div className="px-5 py-12 text-center text-muted-foreground">Booking not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Booking Details" showBack />
      <div className="px-5 pt-6 pb-24 space-y-4">
        <div className={`rounded-2xl border border-l-4 p-5 flex items-center gap-4 ${booking.is_paid ? "border-emerald-200 dark:border-emerald-800 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10" : "border-amber-200 dark:border-amber-800 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10"}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${booking.is_paid ? "icon-emerald" : "icon-amber"}`}>
            <FileText size={20} />
          </div>
          <div>
            <p className="font-bold text-base">{booking.vehicle_details?.name ?? booking.vehicle ?? "Vehicle"}</p>
            <p className="text-sm text-muted-foreground">{booking.vehicle_details?.vehicle_no ?? ""}</p>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${booking.is_paid ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
              {booking.is_paid ? "Paid" : "Pending"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Booking Info</p>
          <DetailRow label="Seat" value={booking.vehicle_seat_details ? `${booking.vehicle_seat_details.side}${booking.vehicle_seat_details.number}` : booking.vehicle_seat ?? "—"} />
          <DetailRow label="User" value={booking.is_guest ? "Guest" : booking.user_details?.name ?? "—"} />
          {booking.trip_details?.trip_id && <DetailRow label="Trip" value={booking.trip_details.trip_id} />}
          <DetailRow label="Payment" value={booking.is_paid ? "Paid" : "Pending"} accent={booking.is_paid ? "green" : "amber"} />
        </div>

        <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Check In</p>
          <DetailRow label="Date & Time" value={formatDate(booking.check_in_datetime)} />
          <DetailRow label="Location" value={latLng(booking.check_in_lat, booking.check_in_lng)} />
          {booking.check_in_address && <DetailRow label="Address" value={booking.check_in_address} />}
        </div>

        {booking.check_out_datetime && (
          <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Check Out</p>
            <DetailRow label="Date & Time" value={formatDate(booking.check_out_datetime)} />
            <DetailRow label="Location" value={latLng(booking.check_out_lat, booking.check_out_lng)} />
            {booking.check_out_address && <DetailRow label="Address" value={booking.check_out_address} />}
          </div>
        )}

        {(booking.trip_distance != null || booking.trip_duration != null || booking.trip_amount != null) && (
          <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trip Summary</p>
            {booking.trip_distance != null && (
              <DetailRow label="Distance" value={`${Number(booking.trip_distance).toFixed(2)} km`} />
            )}
            {booking.trip_duration != null && (
              <DetailRow label="Duration" value={`${Math.floor(Number(booking.trip_duration) / 3600)}h ${Math.floor((Number(booking.trip_duration) % 3600) / 60)}m`} />
            )}
            {booking.trip_amount != null && (
              <DetailRow label="Amount" value={`Rs. ${Number(booking.trip_amount).toLocaleString()}`} accent="green" />
            )}
          </div>
        )}

        <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Record</p>
          <DetailRow label="Created" value={formatDate(booking.created_at)} />
          <DetailRow label="Updated" value={formatDate(booking.updated_at)} />
        </div>
      </div>
    </div>
  );
}
