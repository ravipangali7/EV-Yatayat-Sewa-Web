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

export function DirectBookFlow({
  vehicle,
  userPosition,
  onClose,
  onSuccess,
}: DirectBookFlowProps) {
  const [step, setStep] = useState<"seat" | "confirm">("seat");
  const [selectedSeat, setSelectedSeat] = useState<SeatPosition | null>(null);
  const [destinationPlaceId, setDestinationPlaceId] = useState<string>("");
  const [estimatedAmount, setEstimatedAmount] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const seatsList = vehicle.seats ?? [];
  const availableSeats = seatsList.filter((s) => s.status === "available");
  const seatLayout = Array.isArray(vehicle.seat_layout) && vehicle.seat_layout.length
    ? vehicle.seat_layout
    : seatsList.length > 0
      ? (Array(seatsList.length).fill("x") as string[])
      : ["x", "x", "x", "x"];
  const bookedSeats = new Set(
    seatsList.filter((s) => s.status === "booked").map((s) => `${s.side}${s.number}`)
  );
  const stopPoints = vehicle.active_route_details?.stop_points ?? [];

  const fetchPreview = useCallback(async () => {
    if (!userPosition) return;
    setLoadingPreview(true);
    try {
      const res = await seatBookingApi.directBookPreview({
        vehicle: vehicle.id,
        latitude: userPosition.lat,
        longitude: userPosition.lng,
        ...(destinationPlaceId ? { destination_place: destinationPlaceId } : {}),
      });
      setEstimatedAmount(res.estimated_trip_amount);
    } catch {
      setEstimatedAmount("0");
      toast.error("Could not get fare estimate");
    } finally {
      setLoadingPreview(false);
    }
  }, [vehicle.id, userPosition, destinationPlaceId]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleSeatClick = (pos: SeatPosition) => {
    setSelectedSeat((prev) =>
      prev && prev.side === pos.side && prev.number === pos.number ? null : pos
    );
  };

  const handleProceedToConfirm = () => {
    if (!selectedSeat) {
      toast.error("Select a seat");
      return;
    }
    setStep("confirm");
  };

  const handlePayAndBook = async () => {
    if (!selectedSeat || !userPosition) return;
    const seatId = seatsList.find(
      (s) => s.side === selectedSeat.side && s.number === selectedSeat.number
    )?.id;
    if (!seatId) {
      toast.error("Seat not found");
      return;
    }
    setSubmitting(true);
    try {
      await seatBookingApi.directBook({
        vehicle: vehicle.id,
        vehicle_seat: seatId,
        check_in_lat: userPosition.lat,
        check_in_lng: userPosition.lng,
        check_in_datetime: new Date().toISOString(),
        check_in_address: "Current location",
        trip_amount: parseFloat(estimatedAmount) || 0,
        ...(destinationPlaceId ? { destination_place: destinationPlaceId } : {}),
      });
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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book seat · {vehicle.name}</DialogTitle>
        </DialogHeader>

        {step === "seat" && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Select seat</Label>
              <SeatLayoutVisualizer
                seatLayout={seatLayout}
                seats={seatsList.map((s) => ({ side: s.side, number: s.number }))}
                bookedSeats={bookedSeats}
                selectedSeats={selectedSeat ? [selectedSeat] : []}
                onSeatClick={handleSeatClick}
                onlyAvailable
                multiSelect={false}
              />
            </div>
            {stopPoints.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Destination (optional)</Label>
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
            {loadingPreview ? (
              <p className="text-sm text-muted-foreground">Calculating fare...</p>
            ) : (
              <p className="text-sm font-medium">Est. amount: Rs. {estimatedAmount}</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleProceedToConfirm}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <p className="text-sm">
              Seat {selectedSeat?.side}{selectedSeat?.number} · Rs. {estimatedAmount}
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
