import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SeatLayoutVisualizer, type SeatPosition } from "@/components/vehicles/SeatLayoutVisualizer";
import { seatBookingApi } from "@/modules/seat-bookings/services/seatBookingApi";
import type { VehicleNearby } from "@/types";
import { toast } from "sonner";

interface DirectBookFlowProps {
  vehicle: VehicleNearby;
  userPosition: { lat: number; lng: number } | null;
  onClose: () => void;
  onSuccess: () => void;
}

function seatKey(pos: SeatPosition): string {
  return `${pos.side}${pos.number}`;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Route point with order for unified start + stop_points + end (same logic as driver getDestinationOptions). */
interface RoutePointWithOrder {
  place: string;
  place_details?: { name?: string; latitude?: string; longitude?: string };
  order: number;
  isEnd: boolean;
}

function getUpcomingFromAndTo(vehicle: VehicleNearby): {
  fromStops: Array<{ place: string; place_details?: { name?: string } }>;
  toOptions: Array<{ value: string; label: string }>;
} {
  const route = vehicle.active_route_details;
  const allStops = route?.stop_points ?? [];
  const startPoint = route?.start_point_details;
  const endPoint = route?.end_point_details;

  const toNum = (v: unknown) => (typeof v === "number" && !Number.isNaN(v) ? v : Number(v) || 0);
  const points: RoutePointWithOrder[] = [];
  let order = 0;
  if (startPoint && route?.start_point) {
    points.push({
      place: route.start_point,
      place_details: startPoint,
      order: order++,
      isEnd: false,
    });
  }
  const sortedStops = allStops.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  sortedStops.forEach((sp) => {
    points.push({
      place: sp.place,
      place_details: sp.place_details,
      order: order++,
      isEnd: false,
    });
  });
  if (endPoint && route?.end_point) {
    points.push({
      place: route.end_point,
      place_details: endPoint,
      order: order++,
      isEnd: true,
    });
  }

  const lastLat = parseFloat(vehicle.last_latitude);
  const lastLng = parseFloat(vehicle.last_longitude);
  const hasValidLocation = !Number.isNaN(lastLat) && !Number.isNaN(lastLng);

  if (!hasValidLocation || points.length === 0) {
    const fromStops = points.filter((p) => !p.isEnd);
    const toOptions = points.map((p) => ({
      value: p.place,
      label: p.place_details?.name ?? p.place,
    }));
    return { fromStops, toOptions };
  }

  let nearestOrder = points[0].order;
  let minDist = Infinity;
  for (const p of points) {
    const lat = toNum(p.place_details?.latitude);
    const lng = toNum(p.place_details?.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const d = haversineKm(lastLat, lastLng, lat, lng);
    if (d < minDist) {
      minDist = d;
      nearestOrder = p.order;
    }
  }

  const fromNearest = points.filter((p) => p.order >= nearestOrder);
  const fromStops = fromNearest.filter((p) => !p.isEnd);
  const toOptions = fromNearest.map((p) => ({
    value: p.place,
    label: p.place_details?.name ?? p.place,
  }));
  return { fromStops, toOptions };
}

export function DirectBookFlow({
  vehicle,
  userPosition,
  onClose,
  onSuccess,
}: DirectBookFlowProps) {
  const [step, setStep] = useState<"seat" | "confirm">("seat");
  const [selectedSeats, setSelectedSeats] = useState<SeatPosition[]>([]);
  const [fromPlaceId, setFromPlaceId] = useState<string>("");
  const [destinationPlaceId, setDestinationPlaceId] = useState<string>("");
  const [estimatedAmountPerSeat, setEstimatedAmountPerSeat] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const seatsList = vehicle.seats ?? [];
  const seatLayout = Array.isArray(vehicle.seat_layout) && vehicle.seat_layout.length
    ? vehicle.seat_layout
    : seatsList.length > 0
      ? (Array(seatsList.length).fill("x") as string[])
      : ["x", "x", "x", "x"];
  const bookedSeats = new Set(
    seatsList.filter((s) => s.status === "booked").map((s) => `${s.side}${s.number}`)
  );

  const { fromStops, toOptions } = useMemo(() => getUpcomingFromAndTo(vehicle), [vehicle]);
  const hasStopsList = fromStops.length > 0;

  useEffect(() => {
    if (!fromStops.some((sp) => sp.place === fromPlaceId)) setFromPlaceId("");
    if (!toOptions.some((o) => o.value === destinationPlaceId)) setDestinationPlaceId("");
  }, [fromStops, toOptions]);

  const fromSet = fromPlaceId !== "";
  const toSet = !!destinationPlaceId;
  const canFetchPreview =
    selectedSeats.length > 0 && !!destinationPlaceId && fromPlaceId !== "";

  const fetchPreview = useCallback(async () => {
    if (!destinationPlaceId || selectedSeats.length === 0 || !fromPlaceId) return;
    setLoadingPreview(true);
    try {
      const res = await seatBookingApi.directBookPreview({
        vehicle: vehicle.id,
        destination_place: destinationPlaceId,
        origin_place: fromPlaceId,
      });
      setEstimatedAmountPerSeat(res.estimated_trip_amount);
    } catch {
      setEstimatedAmountPerSeat("0");
      toast.error("Could not get fare estimate");
    } finally {
      setLoadingPreview(false);
    }
  }, [vehicle.id, userPosition, fromPlaceId, destinationPlaceId, selectedSeats.length]);

  useEffect(() => {
    if (canFetchPreview) {
      fetchPreview();
    } else {
      setEstimatedAmountPerSeat("");
    }
  }, [canFetchPreview, fetchPreview]);

  const handleSeatClick = (pos: SeatPosition) => {
    setSelectedSeats((prev) => {
      const key = seatKey(pos);
      const exists = prev.some((p) => seatKey(p) === key);
      if (exists) return prev.filter((p) => seatKey(p) !== key);
      return [...prev, pos];
    });
  };

  const hasStops = hasStopsList;
  const canProceed =
    selectedSeats.length >= 1 &&
    hasStops &&
    fromSet &&
    toSet &&
    !!estimatedAmountPerSeat;

  const handleProceedToConfirm = () => {
    if (selectedSeats.length === 0) {
      toast.error("Select at least one seat");
      return;
    }
    if (hasStops) {
      if (!fromSet) {
        toast.error("Please select From (pick-up)");
        return;
      }
      if (!destinationPlaceId) {
        toast.error("Please select To (destination)");
        return;
      }
      if (!estimatedAmountPerSeat) {
        toast.error("Please wait for fare to be calculated");
        return;
      }
    }
    setStep("confirm");
  };

  const perSeatAmount = parseFloat(estimatedAmountPerSeat) || 0;
  const totalAmount = perSeatAmount * selectedSeats.length;

  const handlePayAndBook = async () => {
    if (selectedSeats.length === 0) return;
    if (hasStops && !destinationPlaceId) {
      toast.error("Please select To (destination)");
      return;
    }

    const fromPlace = fromPlaceId
      ? fromStops.find((sp) => sp.place === fromPlaceId)?.place_details
      : null;
    const checkInLat = fromPlace?.latitude ?? userPosition?.lat;
    const checkInLng = fromPlace?.longitude ?? userPosition?.lng;
    if (checkInLat == null || checkInLng == null) {
      toast.error("Check-in location is missing. Please select From (pick-up).");
      return;
    }

    const seatIds = selectedSeats
      .map((pos) =>
        seatsList.find((s) => s.side === pos.side && s.number === pos.number)?.id
      )
      .filter((id): id is string => !!id);

    if (seatIds.length !== selectedSeats.length) {
      toast.error("One or more seats not found");
      return;
    }

    setSubmitting(true);
    try {
      const common = {
        vehicle: vehicle.id,
        check_in_lat: checkInLat,
        check_in_lng: checkInLng,
        check_in_datetime: new Date().toISOString(),
        check_in_address: fromPlace?.name ?? "Pick-up location",
        trip_amount: seatIds.length === 1 ? perSeatAmount : totalAmount,
        ...(destinationPlaceId ? { destination_place: destinationPlaceId } : {}),
      };

      if (seatIds.length === 1) {
        await seatBookingApi.directBook({
          ...common,
          vehicle_seat: seatIds[0],
        });
      } else {
        await seatBookingApi.directBookMultiple({
          ...common,
          vehicle_seats: seatIds,
          trip_amount: totalAmount,
        });
      }
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string; code?: string } } };
      const msg = err.response?.data?.error ?? "Booking failed";
      const code = err.response?.data?.code;
      if (code === "insufficient_balance") {
        toast.error("Insufficient wallet balance. Please recharge.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const seatsLabel = selectedSeats.length === 0
    ? ""
    : selectedSeats
        .map((p) => `${p.side}${p.number}`)
        .sort()
        .join(", ");
  const totalDisplay = selectedSeats.length <= 1
    ? estimatedAmountPerSeat
    : String((perSeatAmount * selectedSeats.length).toFixed(2));

  const fromLabel =
    fromStops.find((sp) => sp.place === fromPlaceId)?.place_details?.name ?? fromPlaceId ?? "—";
  const toLabel =
    toOptions.find((o) => o.value === destinationPlaceId)?.label ?? destinationPlaceId ?? "—";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book seat · {vehicle.name}</DialogTitle>
        </DialogHeader>
        {vehicle.active_route_details && (
          <p className="text-sm text-muted-foreground -mt-2">
            Route: {vehicle.active_route_details.start_point_details?.name ?? "—"} → {vehicle.active_route_details.end_point_details?.name ?? "—"}
          </p>
        )}

        {step === "seat" && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Select seat(s)</Label>
              <SeatLayoutVisualizer
                seatLayout={seatLayout}
                seats={seatsList.map((s) => ({ side: s.side, number: s.number }))}
                bookedSeats={bookedSeats}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
                onlyAvailable
                multiSelect
              />
            </div>
            {selectedSeats.length > 0 && (
              <p className="text-sm font-medium">
                Selected Seat: {seatsLabel}
              </p>
            )}
            {!hasStopsList && (
              <p className="text-sm text-amber-600">
                This vehicle has no route stops. From and To are required for short-trip booking.
              </p>
            )}
            {hasStopsList && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">From (required)</Label>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={fromPlaceId}
                    onChange={(e) => setFromPlaceId(e.target.value)}
                  >
                    <option value="">— Select pick-up —</option>
                    {fromStops.map((sp) => (
                      <option key={sp.id} value={sp.place}>
                        {sp.place_details?.name ?? sp.place}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To (required)</Label>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={destinationPlaceId}
                    onChange={(e) => setDestinationPlaceId(e.target.value)}
                  >
                    <option value="">— Select destination —</option>
                    {toOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {!canFetchPreview && (
              <p className="text-sm text-muted-foreground">
                Select seat(s), From and To to see estimated amount
              </p>
            )}
            {canFetchPreview && loadingPreview && (
              <p className="text-sm text-muted-foreground">Calculating fare...</p>
            )}
            {canFetchPreview && !loadingPreview && (
              <p className="text-sm font-medium">
                Est. amount: Rs. {selectedSeats.length <= 1 ? estimatedAmountPerSeat : totalDisplay}
                {selectedSeats.length > 1 && (
                  <span className="text-muted-foreground font-normal">
                    {" "}({selectedSeats.length} × Rs. {estimatedAmountPerSeat})
                  </span>
                )}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleProceedToConfirm}
                disabled={!canProceed}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            {hasStops && (
              <p className="text-sm text-muted-foreground">
                From {fromLabel} → To {toLabel}
              </p>
            )}
            <p className="text-sm">
              Selected Seat: {seatsLabel} · Rs. {totalDisplay}
            </p>
            <p className="text-xs text-muted-foreground">
              Amount will be deducted from your wallet.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setStep("seat")}
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handlePayAndBook}
                disabled={submitting}
              >
                {submitting ? "Booking..." : "Pay & Book"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
