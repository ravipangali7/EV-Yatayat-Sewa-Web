import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { tripApi, type TripSeatBookingDetail } from '@/modules/trips/services/tripApi';
import type { Vehicle, VehicleSeat } from '@/types';
import { SeatLayoutVisualizer } from '@/components/vehicles/SeatLayoutVisualizer';
import { cn } from '@/lib/utils';

const REFRESH_MS = 5000;

const today = () => new Date().toISOString().slice(0, 10);

function formatRs(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return iso;
  }
}

function bookingFromLabel(b: TripSeatBookingDetail): string {
  return b.origin_place_details?.name?.trim() || b.check_in_address?.trim() || '—';
}

function bookingToLabel(b: TripSeatBookingDetail): string {
  return b.destination_place_details?.name?.trim() || '—';
}

/** Active trip: only passengers still on board. Completed trip: all bookings in snapshot. */
function bookedSeatKeys(bookings: TripSeatBookingDetail[] | undefined, tripActive: boolean): Set<string> {
  const list = bookings ?? [];
  const relevant = tripActive ? list.filter((b) => !b.check_out_datetime) : list;
  return new Set(
    relevant
      .map((b) =>
        b.vehicle_seat_details ? `${b.vehicle_seat_details.side}${b.vehicle_seat_details.number}` : ''
      )
      .filter(Boolean)
  );
}

interface TripListItem {
  id: string;
  trip_id: string;
  start_time: string | null;
  end_time: string | null;
  driver_name: string | null;
  route_name: string | null;
}

interface TripDetailWithRevenue {
  seat_bookings?: TripSeatBookingDetail[];
  total_seat_booking_revenue?: string;
  total_revenue?: string;
}

export interface VehicleDetailSheetProps {
  vehicleId: string | null;
  open: boolean;
  onClose: () => void;
  vehicleName?: string;
  vehicleNo?: string;
}

export function VehicleDetailSheet({
  vehicleId,
  open,
  onClose,
  vehicleName: propVehicleName,
  vehicleNo: propVehicleNo,
}: VehicleDetailSheetProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [seats, setSeats] = useState<VehicleSeat[]>([]);
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tripDetailsCache, setTripDetailsCache] = useState<Map<string, TripDetailWithRevenue>>(new Map());
  const [loadingTripId, setLoadingTripId] = useState<string | null>(null);
  const [tripErrorId, setTripErrorId] = useState<string | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | undefined>(undefined);

  const tripDetailsCacheRef = useRef(tripDetailsCache);
  tripDetailsCacheRef.current = tripDetailsCache;

  const expandedTripIdRef = useRef<string | undefined>(undefined);
  expandedTripIdRef.current = expandedTripId;

  const refreshTripDetail = useCallback(
    async (tripId: string, opts: { force?: boolean; silent?: boolean } = {}) => {
      if (!opts.force && tripDetailsCacheRef.current.has(tripId)) return;
      const showRowSpinner = !opts.silent && !tripDetailsCacheRef.current.has(tripId);
      if (showRowSpinner) setLoadingTripId(tripId);
      if (!opts.silent) setTripErrorId(null);
      try {
        const detail = (await tripApi.getDetail(tripId)) as TripDetailWithRevenue & {
          seat_bookings?: TripSeatBookingDetail[];
        };
        const slice: TripDetailWithRevenue = {
          seat_bookings: detail.seat_bookings,
          total_seat_booking_revenue: detail.total_seat_booking_revenue,
          total_revenue: detail.total_revenue,
        };
        setTripDetailsCache((prev) => {
          const next = new Map(prev);
          next.set(tripId, slice);
          return next;
        });
      } catch {
        if (!opts.silent) setTripErrorId(tripId);
      } finally {
        if (showRowSpinner) setLoadingTripId(null);
      }
    },
    []
  );

  const fetchVehicleAndTripsInitial = useCallback(async (id: string) => {
    setLoading(true);
    setTripDetailsCache(new Map());
    setTripErrorId(null);
    setExpandedTripId(undefined);
    expandedTripIdRef.current = undefined;
    try {
      const [vehicleRes, tripsRes, seatsRes] = await Promise.all([
        vehicleApi.get(id),
        tripApi.list({
          vehicle: id,
          date_from: today(),
          date_to: today(),
          per_page: 50,
        }),
        vehicleApi.getSeats(id),
      ]);
      setVehicle(vehicleRes);
      setSeats(seatsRes ?? []);
      setTrips((tripsRes?.results ?? []) as TripListItem[]);
    } catch {
      setVehicle(null);
      setSeats([]);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const pollVehicleAndTrips = useCallback(async (id: string) => {
    try {
      const [vehicleRes, tripsRes, seatsRes] = await Promise.all([
        vehicleApi.get(id),
        tripApi.list({
          vehicle: id,
          date_from: today(),
          date_to: today(),
          per_page: 50,
        }),
        vehicleApi.getSeats(id),
      ]);
      setVehicle(vehicleRes);
      setSeats(seatsRes ?? []);
      const list = (tripsRes?.results ?? []) as TripListItem[];
      setTrips(list);
      const tid = expandedTripIdRef.current;
      if (tid) {
        const t = list.find((x) => x.id === tid);
        if (t && !t.end_time) {
          await refreshTripDetail(tid, { force: true, silent: true });
        }
      }
    } catch {
      /* ignore transient poll errors */
    }
  }, [refreshTripDetail]);

  useEffect(() => {
    if (open && vehicleId) {
      void fetchVehicleAndTripsInitial(vehicleId);
    } else if (!open) {
      setVehicle(null);
      setSeats([]);
      setTrips([]);
      setTripDetailsCache(new Map());
      setExpandedTripId(undefined);
      expandedTripIdRef.current = undefined;
    }
  }, [open, vehicleId, fetchVehicleAndTripsInitial]);

  useEffect(() => {
    if (!open || !vehicleId) return;
    const id = vehicleId;
    const handle = window.setInterval(() => {
      void pollVehicleAndTrips(id);
    }, REFRESH_MS);
    return () => window.clearInterval(handle);
  }, [open, vehicleId, pollVehicleAndTrips]);

  useEffect(() => {
    if (expandedTripId && !trips.some((t) => t.id === expandedTripId)) {
      setExpandedTripId(undefined);
      expandedTripIdRef.current = undefined;
    }
  }, [trips, expandedTripId]);

  const displayName = vehicle?.name ?? propVehicleName ?? 'Vehicle';
  const displayNo = vehicle?.vehicle_no ?? propVehicleNo ?? '—';
  const seatLayout = Array.isArray(vehicle?.seat_layout) && vehicle!.seat_layout!.length > 0
    ? vehicle!.seat_layout!
    : [];
  const seatsForLayout = seats.length > 0 ? seats.map((s) => ({ side: s.side, number: s.number })) : [];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-slate-900 border-slate-700 text-white overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-left text-slate-100">
            {displayName}
          </SheetTitle>
          <p className="text-sm text-slate-400">{displayNo}</p>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading…</div>
          ) : (
            <>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Today&apos;s trips
              </h3>
              {trips.length === 0 ? (
                <p className="text-sm text-slate-500">No trips today.</p>
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  value={expandedTripId}
                  onValueChange={(value) => {
                    const v = value || undefined;
                    setExpandedTripId(v);
                    expandedTripIdRef.current = v;
                    if (v) void refreshTripDetail(v, {});
                  }}
                >
                  {trips.map((trip) => {
                    const detail = tripDetailsCache.get(trip.id);
                    const isLoading = loadingTripId === trip.id;
                    const hasError = tripErrorId === trip.id;
                    const isActive = !trip.end_time;

                    return (
                      <AccordionItem
                        key={trip.id}
                        value={trip.id}
                        className="border-slate-700"
                      >
                        <AccordionTrigger className="py-3 hover:no-underline hover:bg-slate-800/50 rounded-lg px-3 [&[data-state=open]]:bg-slate-800/50 text-left">
                          <div className="flex flex-col gap-1 items-start">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-slate-300">
                                #{trip.trip_id}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              {formatTime(trip.start_time)} — {trip.route_name ?? '—'}
                            </span>
                            {trip.driver_name && (
                              <span className="text-xs text-slate-500">
                                Driver: {trip.driver_name}
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-4 pt-0">
                          {isLoading ? (
                            <div className="py-4 text-center text-slate-500 text-sm">
                              Loading trip details…
                            </div>
                          ) : hasError ? (
                            <div className="py-4 text-center text-amber-400 text-sm">
                              Failed to load trip details.
                            </div>
                          ) : detail ? (
                            <div className="space-y-4">
                              {seatLayout.length > 0 && (
                                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                                  <SeatLayoutVisualizer
                                    seatLayout={seatLayout}
                                    seats={seatsForLayout}
                                    bookedSeats={bookedSeatKeys(detail.seat_bookings, isActive)}
                                    size="default"
                                  />
                                </div>
                              )}
                              {seatLayout.length === 0 && (
                                <p className="text-xs text-slate-500">No seat layout defined.</p>
                              )}

                              <div>
                                <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                                  Seat bookings
                                </h4>
                                {(detail.seat_bookings?.length ?? 0) === 0 ? (
                                  <p className="text-xs text-slate-500">No seat bookings.</p>
                                ) : (
                                  <div className="rounded-lg border border-slate-700 overflow-x-auto">
                                    <table className="w-full text-xs min-w-[32rem]">
                                      <thead>
                                        <tr className="bg-slate-800/60 border-b border-slate-700">
                                          <th className="text-left py-2 px-2 text-slate-400 font-medium">Seat</th>
                                          <th className="text-left py-2 px-2 text-slate-400 font-medium">Passenger</th>
                                          <th className="text-left py-2 px-2 text-slate-400 font-medium">From</th>
                                          <th className="text-left py-2 px-2 text-slate-400 font-medium">To</th>
                                          <th className="text-left py-2 px-2 text-slate-400 font-medium">Check-in</th>
                                          <th className="text-left py-2 px-2 text-slate-400 font-medium">Check-out</th>
                                          <th className="text-right py-2 px-2 text-slate-400 font-medium">Amount</th>
                                          <th className="text-center py-2 px-2 text-slate-400 font-medium">Paid</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(detail.seat_bookings ?? []).map((b) => {
                                          const seatLabel = b.vehicle_seat_details
                                            ? `${b.vehicle_seat_details.side}${b.vehicle_seat_details.number}`
                                            : '—';
                                          const name = b.is_guest
                                            ? 'Guest'
                                            : (b.user_details?.name ?? b.user_details?.phone ?? '—');
                                          const checkIn = b.check_in_datetime
                                            ? formatTime(b.check_in_datetime)
                                            : '—';
                                          const checkOut = b.check_out_datetime
                                            ? formatTime(b.check_out_datetime)
                                            : '—';
                                          const amount =
                                            b.trip_amount != null
                                              ? typeof b.trip_amount === 'string'
                                                ? parseFloat(b.trip_amount)
                                                : b.trip_amount
                                              : 0;
                                          return (
                                            <tr
                                              key={b.id}
                                              className="border-b border-slate-700/60 last:border-0"
                                            >
                                              <td className="py-2 px-2 font-mono whitespace-nowrap">{seatLabel}</td>
                                              <td className="py-2 px-2 text-slate-300 max-w-[7rem] truncate" title={name}>
                                                {name}
                                              </td>
                                              <td className="py-2 px-2 text-slate-400 max-w-[8rem] truncate" title={bookingFromLabel(b)}>
                                                {bookingFromLabel(b)}
                                              </td>
                                              <td className="py-2 px-2 text-slate-400 max-w-[8rem] truncate" title={bookingToLabel(b)}>
                                                {bookingToLabel(b)}
                                              </td>
                                              <td className="py-2 px-2 text-slate-400 whitespace-nowrap">{checkIn}</td>
                                              <td className="py-2 px-2 text-slate-400 whitespace-nowrap">{checkOut}</td>
                                              <td className="py-2 px-2 text-right text-slate-300 whitespace-nowrap">
                                                {formatRs(amount)}
                                              </td>
                                              <td className="py-2 px-2 text-center">
                                                <span
                                                  className={cn(
                                                    'px-1.5 py-0.5 rounded text-[10px] font-medium',
                                                    b.is_paid
                                                      ? 'bg-emerald-500/20 text-emerald-400'
                                                      : 'bg-amber-500/20 text-amber-400'
                                                  )}
                                                >
                                                  {b.is_paid ? 'Yes' : 'No'}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-4 text-xs">
                                {detail.total_seat_booking_revenue != null && (
                                  <span className="text-slate-400">
                                    Seat revenue:{' '}
                                    <span className="font-semibold text-slate-200">
                                      {formatRs(parseFloat(detail.total_seat_booking_revenue) || 0)}
                                    </span>
                                  </span>
                                )}
                                {detail.total_revenue != null && (
                                  <span className="text-slate-400">
                                    Total:{' '}
                                    <span className="font-semibold text-emerald-400">
                                      {formatRs(parseFloat(detail.total_revenue) || 0)}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
