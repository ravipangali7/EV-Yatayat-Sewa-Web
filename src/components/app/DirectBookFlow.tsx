import { useState, useEffect, useCallback } from "react";
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

export function DirectBookFlow({
  vehicle,
  userPosition,
  onClose,
  onSuccess,
}: DirectBookFlowProps) {
  const [step, setStep] = useState<"seat" | "confirm">("seat");
  const [selectedSeats, setSelectedSeats] = useState<SeatPosition[]>([]);
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
  const stopPoints = vehicle.active_route_details?.stop_points ?? [];

  const canFetchPreview = selectedSeats.length > 0 && !!destinationPlaceId && !!userPosition;
  const destinationRequired = stopPoints.length > 0;

  const fetchPreview = useCallback(async () => {
    if (!userPosition || !destinationPlaceId || selectedSeats.length === 0) return;
    setLoadingPreview(true);
    try {
      const res = await seatBookingApi.directBookPreview({
        vehicle: vehicle.id,
        latitude: userPosition.lat,
        longitude: userPosition.lng,
        destination_place: destinationPlaceId,
      });
      setEstimatedAmountPerSeat(res.estimated_trip_amount);
    } catch {
      setEstimatedAmountPerSeat("0");
      toast.error("Could not get fare estimate");
    } finally {
      setLoadingPreview(false);
    }
  }, [vehicle.id, userPosition, destinationPlaceId, selectedSeats.length]);

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

  const canProceed = selectedSeats.length >= 1 && (!destinationRequired || !!destinationPlaceId);

  const handleProceedToConfirm = () => {
    if (selectedSeats.length === 0) {
      toast.error("Select at least one seat");
      return;
    }
    if (destinationRequired && !destinationPlaceId) {
      toast.error("Please select a destination");
      return;
    }
    setStep("confirm");
  };

  const perSeatAmount = parseFloat(estimatedAmountPerSeat) || 0;
  const totalAmount = perSeatAmount * selectedSeats.length;

  const handlePayAndBook = async () => {
    if (selectedSeats.length === 0 || !userPosition) return;
    if (destinationRequired && !destinationPlaceId) {
      toast.error("Please select a destination");
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
        check_in_lat: userPosition.lat,
        check_in_lng: userPosition.lng,
        check_in_datetime: new Date().toISOString(),
        check_in_address: "Current location",
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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book seat · {vehicle.name}</DialogTitle>
        </DialogHeader>

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
            {stopPoints.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Destination {destinationRequired ? "(required)" : ""}
                </Label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={destinationPlaceId}
                  onChange={(e) => setDestinationPlaceId(e.target.value)}
                >
                  <option value="">— Select stop —</option>
                  {stopPoints.map((sp) => (
                    <option key={sp.id} value={sp.place}>
                      {sp.place_details?.name ?? sp.place}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!canFetchPreview && (
              <p className="text-sm text-muted-foreground">
                Select seat(s) and destination to see estimated amount
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
            <p className="text-sm">
              Seat(s) {seatsLabel} · Rs. {totalDisplay}
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
