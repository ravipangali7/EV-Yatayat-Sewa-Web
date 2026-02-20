import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { seatBookingApi } from "@/modules/seat-bookings/services/seatBookingApi";
import type { SeatBooking } from "@/types";
import { format } from "date-fns";

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

  if (loading) {
    return (
      <div className="min-h-screen">
        <AppBar title="Seat Booking" showBack />
        <div className="px-5 py-8 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen">
        <AppBar title="Seat Booking" showBack />
        <div className="px-5 py-8 text-center text-muted-foreground">Booking not found.</div>
      </div>
    );
  }

  const formatDate = (s: string | undefined) => {
    if (!s) return "—";
    try {
      return format(new Date(s), "MMM d, yyyy HH:mm");
    } catch {
      return s;
    }
  };

  return (
    <div className="min-h-screen">
      <AppBar title="Seat Booking Details" showBack />
      <div className="px-5 pt-4 pb-24 space-y-4">
        <div className="app-glass-card rounded-2xl p-4 border border-border/50 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vehicle</span>
            <span className="font-medium">{booking.vehicle_details?.name ?? booking.vehicle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Seat</span>
            <span className="font-medium">{booking.vehicle_seat_details ? `${booking.vehicle_seat_details.side}${booking.vehicle_seat_details.number}` : booking.vehicle_seat ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Check-in</span>
            <span className="font-medium">{formatDate(booking.check_in_datetime)}</span>
          </div>
          {booking.check_out_datetime && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-medium">{formatDate(booking.check_out_datetime)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className={booking.is_paid ? "text-success font-medium" : "text-warning font-medium"}>
              {booking.is_paid ? "Paid" : "Pending"}
            </span>
          </div>
          {booking.trip_amount != null && (
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">Rs. {Number(booking.trip_amount).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
