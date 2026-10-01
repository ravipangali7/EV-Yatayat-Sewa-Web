import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { SeatLayoutVisualizer, type SeatPosition } from '@/components/vehicles/SeatLayoutVisualizer';
import { vehicleTicketBookingApi, type SeatEntry } from '@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi';
import { vehicleScheduleApi, type SchedulePlace } from '@/modules/vehicle-schedules/services/vehicleScheduleApi';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { userApi } from '@/modules/users/services/userApi';
import { toast } from 'sonner';

export default function VehicleTicketBookingForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Array<{ id: string; date: string; time: string; price: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; phone?: string }>>([]);
  const [selectedSeats, setSelectedSeats] = useState<SeatPosition[]>([]);
  const [places, setPlaces] = useState<SchedulePlace[]>([]);
  const [pickupPoint, setPickupPoint] = useState('');
  const [destinationPoint, setDestinationPoint] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);
  const [fareNote, setFareNote] = useState('');
  const [manualPrice, setManualPrice] = useState(false);
  const [vehicleSeatLayout, setVehicleSeatLayout] = useState<string[]>([]);
  const [vehicleSeats, setVehicleSeats] = useState<Array<{ side: string; number: number }>>([]);
  const [bookedSeats, setBookedSeats] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    user: '',
    is_guest: true,
    name: '',
    phone: '',
    vehicle_schedule: '',
    ticket_id: '',
    price: 0,
    is_paid: false,
  });

  useEffect(() => {
    vehicleScheduleApi.list({ per_page: 500 }).then((r) =>
      setSchedules(r.results.map((s) => ({ id: s.id, date: s.date, time: s.time, price: s.price })))
    ).catch(() => {});
    userApi.list({ per_page: 500 }).then((r) =>
      setUsers(r.results.map((u) => ({ id: u.id, name: u.name || u.username, phone: u.phone })))
    ).catch(() => {});
  }, []);

  const loadScheduleAndVehicle = useCallback(async (scheduleId: string) => {
    try {
      const schedule = await vehicleScheduleApi.get(scheduleId);
      const routePlaces = schedule.places || [];
      setPlaces(routePlaces);
      const first = routePlaces[0]?.id || '';
      const last = routePlaces[routePlaces.length - 1]?.id || '';
      setPickupPoint(first);
      setDestinationPoint(last);
      const vehicleId = schedule.vehicle;
      if (vehicleId) {
        const vehicle = await vehicleApi.get(vehicleId);
        setVehicleSeatLayout(Array.isArray(vehicle.seat_layout) ? vehicle.seat_layout : []);
        setVehicleSeats((vehicle.seats || []).map((s) => ({ side: s.side, number: s.number })));
      } else {
        setVehicleSeatLayout([]);
        setVehicleSeats([]);
      }
      setSelectedSeats([]);
      setManualPrice(false);
    } catch {
      setPlaces([]);
      setPickupPoint('');
      setDestinationPoint('');
      setVehicleSeatLayout([]);
      setVehicleSeats([]);
      setBookedSeats(new Set());
      setUnitPrice(0);
      setFareNote('');
    }
  }, []);

  useEffect(() => {
    if (formData.vehicle_schedule && !isEdit) {
      loadScheduleAndVehicle(formData.vehicle_schedule);
    }
  }, [formData.vehicle_schedule, isEdit, loadScheduleAndVehicle]);

  useEffect(() => {
    if (isEdit || !formData.vehicle_schedule || !pickupPoint || !destinationPoint) return;
    let cancelled = false;
    vehicleScheduleApi.fare(formData.vehicle_schedule, pickupPoint, destinationPoint)
      .then((fare) => {
        if (cancelled) return;
        const unit = Number(fare.unit_price) || 0;
        setUnitPrice(unit);
        const km = Number(fare.distance_km) || 0;
        setFareNote(
          fare.is_full_route
            ? `Full route fare Rs. ${unit.toFixed(2)} per seat`
            : `${km.toFixed(2)} km × Rs. ${Number(fare.price_per_km).toFixed(2)} = Rs. ${unit.toFixed(2)} per seat`
        );
        setBookedSeats(new Set((fare.booked_seats || []).map((s) => `${s.side}${s.number}`)));
        setSelectedSeats((prev) => prev.filter((s) => !(fare.booked_seats || []).some((b) => b.side === s.side && b.number === s.number)));
      })
      .catch(() => {
        if (!cancelled) {
          setUnitPrice(0);
          setFareNote('');
          setBookedSeats(new Set());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [formData.vehicle_schedule, pickupPoint, destinationPoint, isEdit]);

  useEffect(() => {
    if (!manualPrice && unitPrice >= 0 && selectedSeats.length > 0) {
      setFormData((prev) => ({ ...prev, price: Number((unitPrice * selectedSeats.length).toFixed(2)) }));
    }
  }, [unitPrice, selectedSeats.length, manualPrice]);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      vehicleTicketBookingApi.get(id)
        .then((b) => {
          const seatList = Array.isArray(b.seat) ? b.seat : [];
          setFormData({
            user: b.user || '',
            is_guest: b.is_guest,
            name: b.name,
            phone: b.phone,
            vehicle_schedule: b.vehicle_schedule,
            ticket_id: b.ticket_id,
            price: Number(b.price) || 0,
            is_paid: b.is_paid,
          });
        })
        .catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSeatClick = (pos: SeatPosition) => {
    setSelectedSeats((prev) => {
      const key = `${pos.side}${pos.number}`;
      const exists = prev.some((s) => `${s.side}${s.number}` === key);
      if (exists) return prev.filter((s) => `${s.side}${s.number}` !== key);
      return [...prev, pos];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && id) {
        await vehicleTicketBookingApi.edit(id, { is_paid: formData.is_paid, price: formData.price });
        toast.success('Updated');
      } else {
        const seatsPayload: SeatEntry[] = selectedSeats.map((s) => ({ side: s.side, number: s.number }));
        if (seatsPayload.length === 0) {
          toast.error('Select at least one seat');
          setLoading(false);
          return;
        }
        if (!pickupPoint || !destinationPoint) {
          toast.error('Select pickup and destination');
          setLoading(false);
          return;
        }
        const created = await vehicleTicketBookingApi.create({
          user: formData.user || undefined,
          is_guest: formData.is_guest,
          name: formData.name,
          phone: formData.phone,
          vehicle_schedule: formData.vehicle_schedule,
          pickup_point: pickupPoint,
          destination_point: destinationPoint,
          ticket_id: formData.ticket_id || undefined,
          seats: seatsPayload,
          price: formData.price,
          manual_price: manualPrice,
          is_paid: formData.is_paid,
        });
        toast.success('Created');
        navigate(`/admin/vehicle-ticket-bookings/${created.id}`);
        return;
      }
      navigate('/admin/vehicle-ticket-bookings');
    } catch {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Vehicle Ticket Booking' : 'Add Vehicle Ticket Booking'}
        backUrl="/admin/vehicle-ticket-bookings"
      />
      <div className="max-w-2xl border-2 border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/50 border-b border-border px-5 py-3">
          <h2 className="font-bold text-lg text-center tracking-tight">EV Yatayat Sewa</h2>
          <p className="text-sm text-muted-foreground text-center">Ticket Counter</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Select Schedule</h3>
            <div className="space-y-2">
              <Label>Vehicle Schedule</Label>
              <SearchableSelect
                options={schedules.map((s) => ({ value: s.id, label: `${s.date} ${s.time} — Rs. ${s.price}` }))}
                value={formData.vehicle_schedule}
                onChange={(value) => setFormData({ ...formData, vehicle_schedule: value })}
                placeholder="Select schedule"
                disabled={isEdit}
              />
            </div>
            {!isEdit && places.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <SearchableSelect
                    options={places.slice(0, -1).map((p) => ({ value: p.id, label: p.name }))}
                    value={pickupPoint}
                    onChange={(value) => {
                      setPickupPoint(value);
                      const fromIndex = places.findIndex((p) => p.id === value);
                      const toIndex = places.findIndex((p) => p.id === destinationPoint);
                      if (toIndex <= fromIndex) {
                        const next = places[fromIndex + 1];
                        if (next) setDestinationPoint(next.id);
                      }
                    }}
                    placeholder="Pickup stop"
                  />
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <SearchableSelect
                    options={places.filter((p) => places.findIndex((x) => x.id === p.id) > places.findIndex((x) => x.id === pickupPoint)).map((p) => ({ value: p.id, label: p.name }))}
                    value={destinationPoint}
                    onChange={setDestinationPoint}
                    placeholder="Destination stop"
                  />
                </div>
              </div>
            )}
            {fareNote && <p className="text-xs text-muted-foreground">{fareNote}</p>}
          </section>

          {!isEdit && formData.vehicle_schedule && vehicleSeatLayout.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Select Seats</h3>
              <p className="text-xs text-muted-foreground">Click on available seats to toggle selection</p>
              <SeatLayoutVisualizer
                seatLayout={vehicleSeatLayout}
                seats={vehicleSeats}
                bookedSeats={bookedSeats}
                selectedSeats={selectedSeats}
                multiSelect
                onSeatClick={handleSeatClick}
                onlyAvailable
              />
              {selectedSeats.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedSeats.map((s) => `${s.side}${s.number}`).join(', ')} — Rs. {(manualPrice ? formData.price : unitPrice * selectedSeats.length).toFixed(2)}
                </p>
              )}
            </section>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Passenger Info</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_guest} onChange={(e) => setFormData({ ...formData, is_guest: e.target.checked })} disabled={isEdit} />
                <span className="text-sm">Guest</span>
              </label>
            </div>
            {!formData.is_guest && (
              <div className="space-y-2">
                <Label>User</Label>
                <SearchableSelect
                  options={users.map((u) => ({ value: u.id, label: u.phone ? `${u.name} (${u.phone})` : u.name }))}
                  value={formData.user}
                  onChange={(value) => setFormData({ ...formData, user: value })}
                  placeholder="Select user"
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input className="border-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input className="border-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Ticket ID (optional)</Label>
                <Input className="border-input" value={formData.ticket_id} onChange={(e) => setFormData({ ...formData, ticket_id: e.target.value })} placeholder="Auto-generated if empty" />
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Payment</h3>
            <div className="space-y-2">
              <Label>Price (Rs.)</Label>
              <Input
                type="number"
                step="0.01"
                className="border-input"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
                readOnly={!isEdit && !manualPrice}
              />
              {!isEdit && (
                <label className="flex items-center gap-2 pt-1">
                  <input type="checkbox" checked={manualPrice} onChange={(e) => setManualPrice(e.target.checked)} />
                  <span className="text-sm">Set price manually</span>
                </label>
              )}
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_paid} onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })} />
              <span className="text-sm">Paid</span>
            </label>
          </section>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button type="submit" disabled={loading} className="font-semibold">
              {isEdit ? 'Update' : 'Issue Ticket'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/vehicle-ticket-bookings')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
