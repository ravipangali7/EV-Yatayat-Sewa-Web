import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SeatLayoutVisualizer, type SeatPosition } from '@/components/vehicles/SeatLayoutVisualizer';
import { vehicleTicketBookingApi, type SeatEntry } from '@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi';
import { vehicleScheduleApi } from '@/modules/vehicle-schedules/services/vehicleScheduleApi';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { userApi } from '@/modules/users/services/userApi';
import { toast } from 'sonner';

export default function VehicleTicketBookingForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Array<{ id: string; date: string; time: string; price: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSeats, setSelectedSeats] = useState<SeatPosition[]>([]);
  const [schedulePrice, setSchedulePrice] = useState<number>(0);
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
      setUsers(r.results.map((u) => ({ id: u.id, name: u.name || u.username })))
    ).catch(() => {});
  }, []);

  const loadScheduleAndVehicle = useCallback(async (scheduleId: string) => {
    try {
      const [schedule, bookingsRes] = await Promise.all([
        vehicleScheduleApi.get(scheduleId),
        vehicleTicketBookingApi.list({ vehicle_schedule: scheduleId, per_page: 500 }),
      ]);
      setSchedulePrice(Number(schedule.price) || 0);
      const vehicleId = schedule.vehicle;
      if (vehicleId) {
        const vehicle = await vehicleApi.get(vehicleId);
        setVehicleSeatLayout(Array.isArray(vehicle.seat_layout) ? vehicle.seat_layout : []);
        setVehicleSeats((vehicle.seats || []).map((s) => ({ side: s.side, number: s.number })));
      } else {
        setVehicleSeatLayout([]);
        setVehicleSeats([]);
      }
      const booked = new Set<string>();
      for (const b of bookingsRes.results) {
        const seatList = Array.isArray(b.seat) ? b.seat : (b.seat && typeof b.seat === 'object' && 'side' in b.seat ? [{ side: (b.seat as SeatEntry).side, number: (b.seat as SeatEntry).number }] : []);
        for (const s of seatList) {
          if (s && typeof s === 'object' && 'side' in s && 'number' in s) {
            booked.add(`${s.side}${s.number}`);
          }
        }
      }
      setBookedSeats(booked);
      setSelectedSeats([]);
    } catch {
      setVehicleSeatLayout([]);
      setVehicleSeats([]);
      setBookedSeats(new Set());
      setSchedulePrice(0);
    }
  }, []);

  useEffect(() => {
    if (formData.vehicle_schedule && !isEdit) {
      loadScheduleAndVehicle(formData.vehicle_schedule);
    }
  }, [formData.vehicle_schedule, isEdit, loadScheduleAndVehicle]);

  useEffect(() => {
    if (schedulePrice >= 0 && selectedSeats.length > 0) {
      setFormData((prev) => ({ ...prev, price: schedulePrice * selectedSeats.length }));
    }
  }, [schedulePrice, selectedSeats.length]);

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
        await vehicleTicketBookingApi.create({
          user: formData.user || undefined,
          is_guest: formData.is_guest,
          name: formData.name,
          phone: formData.phone,
          vehicle_schedule: formData.vehicle_schedule,
          ticket_id: formData.ticket_id || undefined,
          seats: seatsPayload,
          price: formData.price,
          is_paid: formData.is_paid,
        });
        toast.success('Created');
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
              <select
                className="w-full border border-input rounded-md px-3 py-2 bg-background"
                value={formData.vehicle_schedule}
                onChange={(e) => setFormData({ ...formData, vehicle_schedule: e.target.value })}
                required
                disabled={isEdit}
              >
                <option value="">Select schedule</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>{s.date} {s.time} (Rs. {s.price})</option>
                ))}
              </select>
            </div>
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
                  Selected: {selectedSeats.map((s) => `${s.side}${s.number}`).join(', ')} — Rs. {schedulePrice * selectedSeats.length}
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
                <select
                  className="w-full border border-input rounded-md px-3 py-2 bg-background"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
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
              <Input type="number" step="0.01" className="border-input" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} required readOnly={!isEdit && selectedSeats.length > 0} />
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
