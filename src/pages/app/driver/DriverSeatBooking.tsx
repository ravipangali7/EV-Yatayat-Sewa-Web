import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { seatBookingApi } from "@/modules/seat-bookings/services/seatBookingApi";
import type { SeatBooking } from "@/types";
import { format, subDays } from "date-fns";

type DatePreset = "7" | "30" | "custom" | "all";

export default function DriverSeatBooking() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<SeatBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("30");
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchBookings = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    const params: Parameters<typeof seatBookingApi.list>[0] = {
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
    // "all" = no date filter
    seatBookingApi
      .list(params)
      .then((res) => setBookings(res.results ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [user?.id, search, datePreset, dateFrom, dateTo]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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
      <AppBar title="Seat Booking" showBack />
      <div className="px-5 pt-4 pb-24">
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl border-border/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Date:</span>
            {(["7", "30", "custom", "all"] as const).map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={datePreset === preset ? "default" : "outline"}
                size="sm"
                className="rounded-xl h-8"
                onClick={() => setDatePreset(preset)}
              >
                {preset === "7" ? "7 days" : preset === "30" ? "30 days" : preset === "custom" ? "Custom" : "All"}
              </Button>
            ))}
            {datePreset === "custom" && (
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-32 h-8 text-xs rounded-lg"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-32 h-8 text-xs rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8">Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8">No seat bookings found.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <Link key={b.id} to={`/app/driver/seat-booking/${b.id}`} className="block">
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
                      {b.vehicle_details?.name ?? b.vehicle}
                      {b.vehicle_details?.vehicle_no ? ` · ${b.vehicle_details.vehicle_no}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Seat {b.vehicle_seat_details ? `${b.vehicle_seat_details.side}${b.vehicle_seat_details.number}` : b.vehicle_seat ?? "—"}
                      {" · "}
                      {b.is_guest ? "Guest" : b.user_details?.name ?? "User"}
                      {" · "}
                      {b.is_paid ? "Paid" : "Pending"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDate(b.check_in_datetime)}
                      {b.trip_amount != null ? ` · Rs. ${Number(b.trip_amount).toLocaleString()}` : ""}
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
