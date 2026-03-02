import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleTicketBookingApi, type VehicleTicketBookingRecord } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import { toNumber } from "@/lib/utils";
import AppBar from "@/components/app/AppBar";
import { TrendingUp, DollarSign, TicketCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function DealerRevenue() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<VehicleTicketBookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const commissionPct = user?.ticket_commission ?? 0;

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    vehicleTicketBookingApi.list({ booked_by: user.id, per_page: 100, expand: true })
      .then((res) => setBookings(res.results || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const totalAmount = bookings.reduce((s, b) => s + toNumber(b.price, 0), 0);
  const totalCommission = bookings.reduce((s, b) => s + (toNumber(b.price, 0) * commissionPct) / 100, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Revenue" />
      <div className="px-5 pt-5 pb-24 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-xl icon-emerald flex items-center justify-center mb-2">
              <DollarSign size={14} />
            </div>
            <p className="text-xs text-muted-foreground">Total Sales</p>
            <p className="text-base font-bold">Rs. {totalAmount.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-xl icon-primary flex items-center justify-center mb-2">
              <TrendingUp size={14} />
            </div>
            <p className="text-xs text-muted-foreground">Commission ({commissionPct}%)</p>
            <p className="text-base font-bold text-primary">Rs. {totalCommission.toFixed(0)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-xl icon-blue flex items-center justify-center mb-2">
              <TicketCheck size={14} />
            </div>
            <p className="text-xs text-muted-foreground">Bookings</p>
            <p className="text-base font-bold">{bookings.length}</p>
          </motion.div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booking History</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <TicketCheck size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => {
              const sd = b.schedule_details;
              const amt = toNumber(b.price, 0);
              const commission = (amt * commissionPct) / 100;
              return (
                <div key={b.id} className="bg-white dark:bg-card/80 rounded-xl border border-border/50 border-l-4 border-l-primary p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">PNR: {b.pnr}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {sd?.start_point_name ?? ""} → {sd?.end_point_name ?? ""} · {sd?.date ?? ""} {sd?.time ?? ""}
                      </p>
                      <p className="text-xs mt-1">Passenger: {b.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">Rs. {amt.toLocaleString()}</p>
                      <p className="text-xs text-primary font-medium">+Rs. {commission.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
