import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { useAuth } from "@/contexts/AuthContext";
import { seatBookingApi } from "@/modules/seat-bookings/services/seatBookingApi";
import type { SeatBooking } from "@/types";
import { format } from "date-fns";

export default function DriverSeatBooking() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<SeatBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    seatBookingApi
      .list({ driver: user.id, per_page: 50 })
      .then((res) => setBookings(res.results ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const formatDate = (s: string | undefined) => {
    if (!s) return "—";
    try {
      return format(new Date(s), "MMM d, yyyy · HH:mm");
    } catch {
      return s;
    }
  };

  return (
    <div className="min-h-screen">
      <AppBar title="Seat Booking" showBack />
      <div className="px-5 pt-4 pb-24">
        {loading ? (
          <p className="text-sm text-muted-foreground py-8">Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8">No seat bookings yet.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <Link
                key={b.id}
                to={`/app/driver/seat-booking/${b.id}`}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="app-glass-card rounded-xl p-4 border border-border/50 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {b.vehicle_details?.name ?? b.vehicle} · Seat {b.vehicle_seat_details ? `${b.vehicle_seat_details.side}${b.vehicle_seat_details.number}` : b.vehicle_seat ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(b.check_in_datetime)} · {b.is_paid ? "Paid" : "Pending"}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
