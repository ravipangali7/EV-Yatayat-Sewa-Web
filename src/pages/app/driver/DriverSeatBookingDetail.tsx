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

  const latLng = (lat: number | undefined, lng: number | undefined) => {
    if (lat == null || lng == null) return "—";
    return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
  };

  return (
    <div className="min-h-screen">
      <AppBar title="Seat Booking Details" showBack />
      <div className="px-5 pt-4 pb-24 space-y-4">
        {/* Basic Information */}
        <div className="app-glass-card rounded-2xl p-4 border border-border/50 space-y-3">
          <h3 className="font-semibold text-sm border-b border-border pb-2">Basic Information</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vehicle</span>
            <span className="font-medium">{booking.vehicle_details?.name ?? booking.vehicle}</span>
          </div>
          {booking.vehicle_details?.vehicle_no && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vehicle No</span>
              <span className="font-medium">{booking.vehicle_details.vehicle_no}</span>
            </div>
          )}
          {booking.vehicle_details?.vehicle_type && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{booking.vehicle_details.vehicle_type}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Seat</span>
            <span className="font-medium">
              {booking.vehicle_seat_details ? `${booking.vehicle_seat_details.side}${booking.vehicle_seat_details.number}` : booking.vehicle_seat ?? "—"}
            </span>
          </div>
          {(booking.trip_details?.trip_id || booking.trip) && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trip</span>
              <span className="font-medium">{booking.trip_details?.trip_id ?? booking.trip}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">User Type</span>
            <span className="font-medium">{booking.is_guest ? "Guest" : "Registered User"}</span>
          </div>
          {!booking.is_guest && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">User</span>
              <span className="font-medium">{booking.user_details?.name ?? booking.user ?? "—"}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span className={booking.is_paid ? "text-success font-medium" : "text-warning font-medium"}>
              {booking.is_paid ? "Paid" : "Pending"}
            </span>
          </div>
        </div>

        {/* Check In */}
        <div className="app-glass-card rounded-2xl p-4 border border-border/50 space-y-3">
          <h3 className="font-semibold text-sm border-b border-border pb-2">Check In</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date & Time</span>
            <span className="font-medium">{formatDate(booking.check_in_datetime)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium text-right">{latLng(booking.check_in_lat, booking.check_in_lng)}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-sm block mb-1">Address</span>
            <p className="text-sm">{booking.check_in_address || "—"}</p>
          </div>
        </div>

        {/* Check Out */}
        {booking.check_out_datetime && (
          <div className="app-glass-card rounded-2xl p-4 border border-border/50 space-y-3">
            <h3 className="font-semibold text-sm border-b border-border pb-2">Check Out</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium">{formatDate(booking.check_out_datetime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium text-right">{latLng(booking.check_out_lat, booking.check_out_lng)}</span>
            </div>
            {booking.check_out_address && (
              <div>
                <span className="text-muted-foreground text-sm block mb-1">Address</span>
                <p className="text-sm">{booking.check_out_address}</p>
              </div>
            )}
          </div>
        )}

        {/* Trip Summary */}
        {(booking.trip_distance != null || booking.trip_duration != null || booking.trip_amount != null) && (
          <div className="app-glass-card rounded-2xl p-4 border border-border/50 space-y-3">
            <h3 className="font-semibold text-sm border-b border-border pb-2">Trip Summary</h3>
            {booking.trip_distance != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium">{Number(booking.trip_distance).toFixed(2)} km</span>
              </div>
            )}
            {booking.trip_duration != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">
                  {Math.floor(Number(booking.trip_duration) / 3600)}h {Math.floor((Number(booking.trip_duration) % 3600) / 60)}m
                </span>
              </div>
            )}
            {booking.trip_amount != null && (
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">Rs. {Number(booking.trip_amount).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="app-glass-card rounded-2xl p-4 border border-border/50 space-y-3">
          <h3 className="font-semibold text-sm border-b border-border pb-2">Record</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">{formatDate(booking.created_at)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Updated</span>
            <span className="font-medium">{formatDate(booking.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
