import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Search, Users, Clock, ArrowRight, Car, X, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { SeatLayoutVisualizer, type SeatPosition } from "@/components/vehicles/SeatLayoutVisualizer";
import { vehicleScheduleApi, type SchedulePlace, type VehicleScheduleExpandedRecord } from "@/modules/vehicle-schedules/services/vehicleScheduleApi";
import { vehicleApi } from "@/modules/vehicles/services/vehicleApi";
import { vehicleTicketBookingApi, type SeatEntry, type VehicleTicketBookingRecord } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import AppBar from "@/components/app/AppBar";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
function imageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
}

type BookingTab = "book" | "my-booking";

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function UserBooking() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<BookingTab>(tabParam === "my-booking" ? "my-booking" : "book");
  const [myBookings, setMyBookings] = useState<VehicleTicketBookingRecord[]>([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  const [startPlaces, setStartPlaces] = useState<SchedulePlace[]>([]);
  const [endPlaces, setEndPlaces] = useState<SchedulePlace[]>([]);
  const [fromPlaceId, setFromPlaceId] = useState("");
  const [toPlaceId, setToPlaceId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<VehicleScheduleExpandedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEndPlaces, setLoadingEndPlaces] = useState(false);
  const [selectedResult, setSelectedResult] = useState<VehicleScheduleExpandedRecord | null>(null);
  const [checkoutSchedule, setCheckoutSchedule] = useState<VehicleScheduleExpandedRecord | null>(null);
  const [checkoutVehicleLayout, setCheckoutVehicleLayout] = useState<string[]>([]);
  const [checkoutVehicleSeats, setCheckoutVehicleSeats] = useState<Array<{ side: string; number: number }>>([]);
  const [checkoutBookedSeats, setCheckoutBookedSeats] = useState<Set<string>>(new Set());
  const [checkoutSelectedSeats, setCheckoutSelectedSeats] = useState<SeatPosition[]>([]);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"form" | "confirm">("form");
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (tab === "my-booking" && user?.id) {
      setMyBookingsLoading(true);
      vehicleTicketBookingApi.list({ user: user.id, per_page: 50, expand: true })
        .then((res) => setMyBookings(res.results || []))
        .catch(() => setMyBookings([]))
        .finally(() => setMyBookingsLoading(false));
    }
  }, [tab, user?.id]);

  useEffect(() => {
    vehicleScheduleApi.startPlaces()
      .then((res) => setStartPlaces(Array.isArray(res) ? res : []))
      .catch(() => setStartPlaces([]));
  }, []);

  useEffect(() => {
    if (!fromPlaceId) {
      setEndPlaces([]);
      setToPlaceId("");
      return;
    }
    setLoadingEndPlaces(true);
    vehicleScheduleApi.endPlaces(fromPlaceId)
      .then((res) => setEndPlaces(Array.isArray(res) ? res : []))
      .catch(() => setEndPlaces([]))
      .finally(() => setLoadingEndPlaces(false));
  }, [fromPlaceId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromPlaceId || !toPlaceId || !date) {
      toast.error("Please select From, To and Date");
      return;
    }
    setSearched(true);
    setLoading(true);
    vehicleScheduleApi
      .list({ date, from_place: fromPlaceId, to_place: toPlaceId, expand: true, per_page: 50 })
      .then((res) => {
        const list = (res.results || []) as VehicleScheduleExpandedRecord[];
        setResults(list);
      })
      .catch(() => {
        setResults([]);
        toast.error("Search failed");
      })
      .finally(() => setLoading(false));
  };

  const loadCheckoutData = useCallback(async (schedule: VehicleScheduleExpandedRecord) => {
    const vehicleId = schedule.vehicle;
    try {
      const [vehicle, bookingsRes] = await Promise.all([
        vehicleApi.get(vehicleId),
        vehicleTicketBookingApi.list({ vehicle_schedule: schedule.id, per_page: 500 }),
      ]);
      setCheckoutVehicleLayout(Array.isArray(vehicle.seat_layout) ? vehicle.seat_layout : []);
      setCheckoutVehicleSeats((vehicle.seats || []).map((s) => ({ side: s.side, number: s.number })));
      const booked = new Set<string>();
      for (const b of bookingsRes.results || []) {
        const seatList = Array.isArray(b.seat) ? b.seat : (b.seat && typeof b.seat === "object" && "side" in b.seat ? [b.seat as SeatEntry] : []);
        for (const s of seatList) {
          if (s && typeof s === "object" && "side" in s && "number" in s) {
            booked.add(`${s.side}${s.number}`);
          }
        }
      }
      setCheckoutBookedSeats(booked);
      setCheckoutSelectedSeats([]);
    } catch {
      setCheckoutVehicleLayout([]);
      setCheckoutVehicleSeats([]);
      setCheckoutBookedSeats(new Set());
    }
  }, []);

  const handleOpenDetail = (result: VehicleScheduleExpandedRecord) => {
    setSelectedResult(result);
  };

  const handleBookNow = (result: VehicleScheduleExpandedRecord) => {
    setSelectedResult(null);
    setCheckoutSchedule(result);
    setCheckoutName(user?.name ?? "");
    setCheckoutPhone(user?.phone ?? "");
    setCheckoutStep("form");
    loadCheckoutData(result);
  };

  const handleCheckoutSeatClick = (pos: SeatPosition) => {
    setCheckoutSelectedSeats((prev) => {
      const key = `${pos.side}${pos.number}`;
      const exists = prev.some((s) => `${s.side}${s.number}` === key);
      if (exists) return prev.filter((s) => `${s.side}${s.number}` !== key);
      return [...prev, pos];
    });
  };

  const totalAmount = checkoutSchedule ? Number(checkoutSchedule.price) * checkoutSelectedSeats.length : 0;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutSchedule) return;
    if (checkoutSelectedSeats.length === 0) {
      toast.error("Select at least one seat");
      return;
    }
    if (!checkoutName.trim() || !checkoutPhone.trim()) {
      toast.error("Enter name and phone");
      return;
    }
    setCheckoutStep("confirm");
  };

  const handlePay = async () => {
    if (!checkoutSchedule || !user) return;
    setCheckoutSubmitting(true);
    try {
      const walletsRes = await walletApi.list({ user: user.id, per_page: 1 });
      const wallet = walletsRes.results[0];
      const balance = wallet ? Number(wallet.balance) || 0 : 0;
      if (balance < totalAmount) {
        toast.error("Insufficient balance. Please recharge wallet.");
        navigate("/app/user/deposit");
        setCheckoutSchedule(null);
        setCheckoutStep("form");
        setCheckoutSubmitting(false);
        return;
      }
      setShowPayConfirm(true);
    } catch {
      toast.error("Could not load wallet");
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleConfirmPayFromWallet = async () => {
    if (!checkoutSchedule || !user) return;
    setShowPayConfirm(false);
    setCheckoutSubmitting(true);
    try {
      const seatsPayload: SeatEntry[] = checkoutSelectedSeats.map((s) => ({ side: s.side, number: s.number }));
      const created = await vehicleTicketBookingApi.create({
        is_guest: false,
        name: checkoutName.trim(),
        phone: checkoutPhone.trim(),
        vehicle_schedule: checkoutSchedule.id,
        pickup_point: fromPlaceId || undefined,
        destination_point: toPlaceId || undefined,
        seats: seatsPayload,
        price: totalAmount,
        is_paid: false,
      });
      await vehicleTicketBookingApi.pay(created.id);
      toast.success("Booking paid successfully");
      setCheckoutSchedule(null);
      setCheckoutSelectedSeats([]);
      setCheckoutName("");
      setCheckoutPhone("");
      setCheckoutStep("form");
      setTab("my-booking");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { code?: string } } };
      if (ax?.response?.data?.code === "insufficient_balance") {
        toast.error("Insufficient balance. Please recharge wallet.");
        navigate("/app/user/deposit");
      } else {
        toast.error("Payment failed");
      }
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleCheckoutCancel = () => {
    setCheckoutSchedule(null);
    setCheckoutStep("form");
    setShowPayConfirm(false);
  };

  const fromOptions = startPlaces.map((p) => ({ id: p.id, name: p.name, code: p.code }));
  const toOptions = endPlaces.map((p) => ({ id: p.id, name: p.name, code: p.code }));

  return (
    <div className="min-h-screen pb-20">
      <AppBar title="Book a Ride" />
      <div className="px-5 pt-4">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab("book")}
          className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            tab === "book" ? "bg-primary text-primary-foreground" : "app-surface border border-border"
          }`}
        >
          Book
        </button>
        <button
          type="button"
          onClick={() => setTab("my-booking")}
          className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            tab === "my-booking" ? "bg-primary text-primary-foreground" : "app-surface border border-border"
          }`}
        >
          My Booking
        </button>
      </div>

      {tab === "my-booking" && (
        <div className="space-y-3">
          {myBookingsLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : myBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No bookings yet. Book a ride from the Book tab.</p>
          ) : (
            myBookings.map((b) => {
              const sd = b.schedule_details;
              return (
                <div
                  key={b.id}
                  className="app-surface border border-border rounded-2xl p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">PNR: {b.pnr}</p>
                      <p className="text-xs text-muted-foreground">
                        {sd?.start_point_name ?? ""} → {sd?.end_point_name ?? ""} | {sd?.date ?? ""} {sd?.time ?? ""}
                      </p>
                      <p className="text-xs mt-1">{b.name} · Rs. {b.price}</p>
                      <p className="text-xs text-muted-foreground">{b.is_paid ? "Paid" : "Unpaid"}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={async () => {
                        try {
                          const blob = await vehicleTicketBookingApi.getTicketPdfBlob(b.id);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `ticket-${b.pnr}.pdf`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("Download started");
                        } catch {
                          toast.error("Failed to download ticket");
                        }
                      }}
                    >
                      <FileDown size={14} className="mr-1" /> PDF
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "book" && (
        <>
      <p className="text-sm text-muted-foreground mb-3">From & to</p>
      <form onSubmit={handleSearch} className="space-y-3 mb-6">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">From</label>
          <SearchableSelect
            options={fromOptions}
            value={fromPlaceId}
            onChange={setFromPlaceId}
            placeholder="Select departure place"
            getOptionLabel={(o) => o.name}
            getOptionValue={(o) => o.id}
            className="h-12 rounded-xl"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">To</label>
          <SearchableSelect
            options={toOptions}
            value={toPlaceId}
            onChange={setToPlaceId}
            placeholder={loadingEndPlaces ? "Loading..." : !fromPlaceId ? "Select From first" : "Select destination"}
            disabled={!fromPlaceId || loadingEndPlaces}
            getOptionLabel={(o) => o.name}
            getOptionValue={(o) => o.id}
            className="h-12 rounded-xl"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Departure Date</label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setDate(todayStr())}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                date === todayStr() ? "bg-primary text-primary-foreground" : "app-glass border border-border"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDate(tomorrowStr())}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                date === tomorrowStr() ? "bg-primary text-primary-foreground" : "app-glass border border-border"
              }`}
            >
              Tomorrow
            </button>
          </div>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 h-12 rounded-xl"
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading}>
          <Search size={16} className="mr-2" /> {loading ? "Searching..." : "Search Vehicles"}
        </Button>
      </form>

      <AnimatePresence>
        {searched && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h3 className="text-sm font-bold">{results.length} Vehicles Available</h3>
            {results.map((result) => {
              const rd = result.route_details;
              const vd = result.vehicle_details;
              const imgSrc = vd?.featured_image || (vd?.images && vd.images[0]) || null;
              return (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="app-surface border border-border rounded-2xl p-4 space-y-3 cursor-pointer"
                  onClick={() => handleOpenDetail(result)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {imgSrc ? (
                        <img src={imageUrl(imgSrc)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Car size={24} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm">{vd?.name ?? "Vehicle"}</h3>
                      <p className="text-xs text-muted-foreground">{vd?.vehicle_no}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-primary" />
                      <span>{result.available_seats ?? 0} seats</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{result.time ?? ""}</span>
                    </div>
                    <div className="ml-auto">
                      <span className="font-bold text-foreground text-sm">Rs. {result.price}</span>
                    </div>
                  </div>
                  {rd && (
                    <div className="text-xs text-muted-foreground">
                      <span className="text-primary">{rd.start_point.name}</span>
                      <span className="mx-1">→</span>
                      <span className="text-destructive">{rd.end_point.name}</span>
                    </div>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    className="w-full h-10 rounded-xl text-sm font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookNow(result);
                    }}
                  >
                    Book Now <ArrowRight size={14} className="ml-1" />
                  </Button>
                </motion.div>
              );
            })}
            {results.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground py-4">No vehicles available for this search.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vehicle detail modal */}
      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedResult?.vehicle_details?.name ?? "Vehicle"}</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(selectedResult.vehicle_details?.featured_image
                  ? [selectedResult.vehicle_details.featured_image, ...(selectedResult.vehicle_details.images || []).filter((u) => u !== selectedResult.vehicle_details?.featured_image)]
                  : selectedResult.vehicle_details?.images || []
                ).slice(0, 4).map((src, i) => (
                  <img
                    key={i}
                    src={imageUrl(src)}
                    alt=""
                    className="w-full h-28 object-cover rounded-lg border border-border"
                  />
                ))}
              </div>
              {selectedResult.route_details && (
                <p className="text-sm text-muted-foreground">
                  {selectedResult.route_details.start_point.name} → {selectedResult.route_details.end_point.name}
                </p>
              )}
              <p className="text-sm">
                <span className="text-muted-foreground">Time:</span> {selectedResult.time} &nbsp;|&nbsp;
                <span className="text-muted-foreground">Price:</span> Rs. {selectedResult.price} &nbsp;|&nbsp;
                <span className="text-muted-foreground">Seats:</span> {selectedResult.available_seats ?? 0} available
              </p>
              <Button
                className="w-full"
                onClick={() => handleBookNow(selectedResult)}
              >
                Book Now <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pay from wallet confirmation dialog */}
      <Dialog open={showPayConfirm} onOpenChange={setShowPayConfirm}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Pay from wallet?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">You are paying Rs. {totalAmount.toLocaleString()} from your wallet. Continue?</p>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleConfirmPayFromWallet} disabled={checkoutSubmitting}>
              {checkoutSubmitting ? "Paying..." : "Pay"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowPayConfirm(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout section */}
      <AnimatePresence>
        {checkoutSchedule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-background overflow-y-auto px-5 pt-6 pb-24"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{checkoutStep === "confirm" ? "Confirm & Pay" : "Complete Booking"}</h2>
              <Button variant="ghost" size="icon" onClick={handleCheckoutCancel}>
                <X size={20} />
              </Button>
            </div>
            {checkoutStep === "form" && (
              <>
                {checkoutSchedule.route_details && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {checkoutSchedule.route_details.start_point.name} → {checkoutSchedule.route_details.end_point.name} &nbsp;|&nbsp;
                    {checkoutSchedule.date} {checkoutSchedule.time} &nbsp;|&nbsp; Rs. {checkoutSchedule.price} per seat
                  </p>
                )}
                {checkoutVehicleLayout.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2">Select seats (click to toggle)</p>
                    <p className="text-xs text-muted-foreground mb-2 flex flex-wrap gap-4">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success/30 border border-success" /> Available</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/30 border border-destructive" /> Booked</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/30 border-2 border-primary" /> Selected</span>
                    </p>
                    <SeatLayoutVisualizer
                      seatLayout={checkoutVehicleLayout}
                      seats={checkoutVehicleSeats}
                      bookedSeats={checkoutBookedSeats}
                      selectedSeats={checkoutSelectedSeats}
                      multiSelect
                      onSeatClick={handleCheckoutSeatClick}
                      onlyAvailable
                      size="large"
                    />
                    {checkoutSelectedSeats.length > 0 && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Selected: {checkoutSelectedSeats.map((s) => `${s.side}${s.number}`).join(", ")} — Rs. {totalAmount}
                      </p>
                    )}
                  </div>
                )}
                <form onSubmit={handleProceedToConfirm} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} placeholder="Your name" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone</label>
                    <Input value={checkoutPhone} onChange={(e) => setCheckoutPhone(e.target.value)} placeholder="Phone number" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={checkoutSelectedSeats.length === 0}>
                    Proceed to Pay
                  </Button>
                </form>
              </>
            )}
            {checkoutStep === "confirm" && (
              <div className="space-y-6">
                {checkoutSchedule.route_details && (
                  <div className="app-surface rounded-xl p-4 border border-border space-y-1">
                    <p className="font-medium">{checkoutSchedule.route_details.start_point.name} → {checkoutSchedule.route_details.end_point.name}</p>
                    <p className="text-sm text-muted-foreground">{checkoutSchedule.date} {checkoutSchedule.time}</p>
                    <p className="text-sm">Seats: {checkoutSelectedSeats.map((s) => `${s.side}${s.number}`).join(", ")}</p>
                    <p className="text-sm">Passenger: {checkoutName} · {checkoutPhone}</p>
                    <p className="font-bold text-lg pt-2">Total: Rs. {totalAmount.toLocaleString()}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleCheckoutCancel}>Cancel</Button>
                  {user ? (
                    <Button className="flex-1" onClick={handlePay} disabled={checkoutSubmitting}>
                      {checkoutSubmitting ? "Checking..." : "Pay"}
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      disabled={checkoutSubmitting}
                      onClick={async () => {
                        setCheckoutSubmitting(true);
                        try {
                          const seatsPayload: SeatEntry[] = checkoutSelectedSeats.map((s) => ({ side: s.side, number: s.number }));
                          await vehicleTicketBookingApi.create({
                            is_guest: true,
                            name: checkoutName.trim(),
                            phone: checkoutPhone.trim(),
                            vehicle_schedule: checkoutSchedule.id,
                            pickup_point: fromPlaceId || undefined,
                            destination_point: toPlaceId || undefined,
                            seats: seatsPayload,
                            price: totalAmount,
                            is_paid: false,
                          });
                          toast.success("Booking created. Pay at counter.");
                          handleCheckoutCancel();
                          setTab("my-booking");
                        } catch {
                          toast.error("Booking failed");
                        } finally {
                          setCheckoutSubmitting(false);
                        }
                      }}
                    >
                      {checkoutSubmitting ? "Booking..." : "Book as guest"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
      </div>
    </div>
  );
}
