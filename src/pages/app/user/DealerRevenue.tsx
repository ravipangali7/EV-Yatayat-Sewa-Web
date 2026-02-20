import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleTicketBookingApi, type VehicleTicketBookingRecord } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import { toNumber } from "@/lib/utils";
import AppBar from "@/components/app/AppBar";

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
    <div className="min-h-screen">
      <AppBar title="Revenue" />
      <div className="px-5 pt-4 pb-24">
        <div className="app-glass-card rounded-2xl p-5 border border-border/50 mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total bookings</p>
            <p className="text-xl font-bold">Rs. {totalAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Commission ({commissionPct}%)</p>
            <p className="text-xl font-bold text-primary">Rs. {totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <h3 className="font-semibold text-sm mb-3">Booking history</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const sd = b.schedule_details;
              const amt = toNumber(b.price, 0);
              const commission = (amt * commissionPct) / 100;
              return (
                <div key={b.id} className="app-glass-card rounded-xl p-4 border border-border/50 space-y-1">
                  <p className="font-bold text-sm">PNR: {b.pnr}</p>
                  <p className="text-xs text-muted-foreground">
                    {sd?.start_point_name ?? ""} → {sd?.end_point_name ?? ""} | {sd?.date ?? ""} {sd?.time ?? ""}
                  </p>
                  <p className="text-xs">Passenger: {b.name} · Rs. {amt.toLocaleString()}</p>
                  <p className="text-xs text-primary font-medium">Commission: Rs. {commission.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
