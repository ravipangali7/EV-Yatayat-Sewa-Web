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
    <div className="min-h-screen bg-background">
      <AppBar title="Seat Bookings" showBack />
      <div className="px-5 pt-4 pb-24">
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
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
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <FileText size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No seat bookings found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <Link key={b.id} to={`/app/driver/seat-booking/${b.id}`} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white dark:bg-card/80 rounded-2xl border border-l-4 p-4 hover:shadow-sm transition-all ${b.is_paid ? "border-emerald-200 dark:border-emerald-800 border-l-emerald-500" : "border-amber-200 dark:border-amber-800 border-l-amber-500"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${b.is_paid ? "icon-emerald" : "icon-amber"}`}>
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {b.vehicle_details?.name ?? b.vehicle ?? "—"}
                        {b.vehicle_details?.vehicle_no ? ` · ${b.vehicle_details.vehicle_no}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Seat {b.vehicle_seat_details ? `${b.vehicle_seat_details.side}${b.vehicle_seat_details.number}` : b.vehicle_seat ?? "—"} · {b.is_guest ? "Guest" : b.user_details?.name ?? "User"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {b.trip_amount != null && (
                        <p className="text-sm font-bold">Rs. {Number(b.trip_amount).toLocaleString()}</p>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${b.is_paid ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                        {b.is_paid ? "Paid" : "Pending"}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 ml-12">{formatDate(b.check_in_datetime)}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
