import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleTicketBookingApi, type VehicleTicketBookingRecord } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import { toNumber } from "@/lib/utils";

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
    <div className="min-h-screen px-5 pt-6 pb-24">
      <h2 className="text-lg font-bold mb-4">Revenue</h2>
      <div className="app-surface rounded-2xl p-4 border border-border mb-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Total bookings</p>
          <p className="text-xl font-bold">Rs. {totalAmount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Commission ({commissionPct}%)</p>
          <p className="text-xl font-bold text-primary">Rs. {totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
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
              <div key={b.id} className="app-surface border border-border rounded-xl p-4 space-y-1">
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
  );
}
