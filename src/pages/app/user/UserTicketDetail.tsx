import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { vehicleTicketBookingApi, type VehicleTicketBookingRecord } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import { tripApi } from "@/modules/trips/services/tripApi";
import { format } from "date-fns";
import { FileText, MapPin, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { resolveAppRole, getAppRoleConfig } from "@/config/appRoles";
import { toast } from "sonner";

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: "green" | "amber" }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold text-right ${accent === "green" ? "text-emerald-600 dark:text-emerald-400" : accent === "amber" ? "text-amber-600" : ""}`}>{value}</span>
    </div>
  );
}

type TicketLiveTrackStatus = "wait" | "expired" | "available" | "not_started" | "loading";

function getScheduleDatetime(sd: { date: string | null; time: string | null } | undefined): Date | null {
  if (!sd?.date) return null;
  const dateStr = sd.date;
  const timeStr = sd.time ?? "00:00";
  try {
    const combined = `${dateStr}T${timeStr}:00`;
    return new Date(combined);
  } catch {
    return new Date(dateStr);
  }
}

export default function UserTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<VehicleTicketBookingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [liveTrackStatus, setLiveTrackStatus] = useState<TicketLiveTrackStatus>("loading");

  const role = resolveAppRole(user);
  const config = role ? getAppRoleConfig(role) : null;
  const basePath = config?.basePath ?? "/app/user";
  const trackPath = `${basePath}/booking/track`;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    vehicleTicketBookingApi
      .get(id, { expand: true })
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!booking?.vehicle_schedule || !booking?.schedule_details) {
      setLiveTrackStatus("not_started");
      return;
    }
    const sd = booking.schedule_details;
    const scheduleDt = getScheduleDatetime(sd);
    if (!scheduleDt) {
      setLiveTrackStatus("not_started");
      return;
    }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scheduleDateStart = new Date(scheduleDt.getFullYear(), scheduleDt.getMonth(), scheduleDt.getDate());
    if (scheduleDateStart > todayStart) {
      setLiveTrackStatus("wait");
      return;
    }
    const expiryDt = new Date(scheduleDt.getTime() + 24 * 60 * 60 * 1000);
    if (now > expiryDt) {
      setLiveTrackStatus("expired");
      return;
    }
    tripApi
      .list({ vehicle_schedule: booking.vehicle_schedule, active_only: true, per_page: 1 })
      .then((res) => {
        const results = res.results as Array<{ id: string }>;
        if (results?.length > 0 && results[0].id) {
          setActiveTripId(results[0].id);
          setLiveTrackStatus("available");
        } else {
          setLiveTrackStatus("not_started");
        }
      })
      .catch(() => setLiveTrackStatus("not_started"));
  }, [booking?.vehicle_schedule, booking?.schedule_details]);

  const formatSeat = (seat: VehicleTicketBookingRecord["seat"]) => {
    if (Array.isArray(seat)) {
      return seat.map((s) => (s && typeof s === "object" && "side" in s && "number" in s ? `${s.side}${s.number}` : "")).filter(Boolean).join(", ") || "—";
    }
    if (seat && typeof seat === "object" && "side" in seat && "number" in seat) {
      return `${(seat as { side: string; number: number }).side}${(seat as { side: string; number: number }).number}`;
    }
    return "—";
  };

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!booking) return;
    try {
      const blob = await vehicleTicketBookingApi.getTicketPdfBlob(booking.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${booking.pnr}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download ticket");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar title="Ticket details" showBack />
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar title="Ticket details" showBack />
        <div className="px-5 py-12 text-center text-muted-foreground">Ticket not found.</div>
      </div>
    );
  }

  const sd = booking.schedule_details;

  return (
    <div className="min-h-screen bg-background">
      <AppBar
        title="Ticket details"
        showBack
        right={
          <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={handleDownloadPdf}>
            <FileDown size={14} /> PDF
          </Button>
        }
      />
      <div className="px-5 pt-6 pb-24 space-y-4">
        <div className={`rounded-2xl border border-l-4 p-5 flex items-center gap-4 ${booking.is_paid ? "border-emerald-200 dark:border-emerald-800 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10" : "border-amber-200 dark:border-amber-800 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10"}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${booking.is_paid ? "icon-emerald" : "icon-amber"}`}>
            <FileText size={20} />
          </div>
          <div>
            <p className="font-bold text-base">PNR: {booking.pnr}</p>
            <p className="text-sm text-muted-foreground">{sd?.start_point_name ?? ""} → {sd?.end_point_name ?? ""}</p>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${booking.is_paid ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
              {booking.is_paid ? "Paid" : "Pending"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trip details</p>
          <DetailRow label="Route" value={`${sd?.start_point_name ?? ""} → ${sd?.end_point_name ?? ""}`} />
          <DetailRow label="Date & time" value={sd?.date && sd?.time ? `${sd.date} ${sd.time}` : "—"} />
          <DetailRow label="Vehicle" value={sd?.vehicle_name ?? "—"} />
          <DetailRow label="Seat(s)" value={formatSeat(booking.seat)} />
          <DetailRow label="Price" value={`Rs. ${Number(booking.price).toLocaleString()}`} accent="green" />
        </div>

        <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Passenger</p>
          <DetailRow label="Name" value={booking.name} />
          <DetailRow label="Phone" value={booking.phone} />
        </div>

        <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Live tracking</p>
          {liveTrackStatus === "wait" && <p className="text-sm text-muted-foreground">Wait till your day comes.</p>}
          {liveTrackStatus === "expired" && <p className="text-sm text-muted-foreground">Expired. Live tracking is no longer available for this trip.</p>}
          {liveTrackStatus === "loading" && <p className="text-sm text-muted-foreground">Checking...</p>}
          {liveTrackStatus === "not_started" && <p className="text-sm text-muted-foreground">Tracking not available yet. The trip may not have started.</p>}
          {liveTrackStatus === "available" && activeTripId && (
            <Button className="w-full rounded-xl gap-2" onClick={() => navigate(`${trackPath}/${activeTripId}`)}>
              <MapPin size={18} /> Live tracking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
