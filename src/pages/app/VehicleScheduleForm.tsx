import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { vehicleScheduleApi } from '@/modules/vehicle-schedules/services/vehicleScheduleApi';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { routeApi } from '@/modules/routes/services/routeApi';
import { toast } from 'sonner';

export default function VehicleScheduleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Array<{ id: string; name: string; vehicle_no?: string }>>([]);
  const [routes, setRoutes] = useState<Array<{ id: string; name: string; is_bidirectional?: boolean }>>([]);
  const [formData, setFormData] = useState({
    vehicle: '',
    route: '',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    price: 0,
    reverse_direction: false,
  });

  useEffect(() => {
    Promise.all([
      vehicleApi.list({ per_page: 500 }).then((r) => r.results.map((v) => ({ id: v.id, name: v.name, vehicle_no: v.vehicle_no }))),
      routeApi.list({ per_page: 500 }).then((r) => r.results.map((rte) => ({ id: rte.id, name: rte.name, is_bidirectional: rte.is_bidirectional }))),
    ]).then(([v, r]) => {
      setVehicles(v);
      setRoutes(r);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      vehicleScheduleApi.get(id)
        .then((s) => {
          setFormData({
            vehicle: s.vehicle,
            route: s.route,
            date: s.date,
            time: s.time?.slice(0, 5) || '09:00',
            price: Number(s.price) || 0,
            reverse_direction: s.reverse_direction ?? false,
          });
        })
        .catch(() => toast.error('Failed to load schedule'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && id) {
        await vehicleScheduleApi.edit(id, { ...formData, reverse_direction: formData.reverse_direction });
        toast.success('Schedule updated');
      } else {
        await vehicleScheduleApi.create({ ...formData, reverse_direction: formData.reverse_direction });
        toast.success('Schedule created');
      }
      navigate('/admin/vehicle-schedules');
    } catch {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Vehicle Schedule' : 'Add Vehicle Schedule'}
        backUrl="/admin/vehicle-schedules"
      />
      <div className="max-w-xl border-2 border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/50 border-b border-border px-5 py-3">
          <h2 className="font-bold text-lg text-center tracking-tight">EV Yatayat Sewa</h2>
          <p className="text-sm text-muted-foreground text-center">Schedule Counter</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Trip Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <SearchableSelect
                  options={vehicles.map((v) => ({ value: v.id, label: v.vehicle_no ? `${v.name} (${v.vehicle_no})` : v.name }))}
                  value={formData.vehicle}
                  onChange={(value) => setFormData({ ...formData, vehicle: value })}
                  placeholder="Select vehicle"
                />
              </div>
              <div className="space-y-2">
                <Label>Route</Label>
                <SearchableSelect
                  options={routes.map((r) => ({ value: r.id, label: r.name }))}
                  value={formData.route}
                  onChange={(value) => setFormData({ ...formData, route: value })}
                  placeholder="Select route"
                />
              </div>
              {formData.route && routes.find((r) => r.id === formData.route)?.is_bidirectional && (
                <div className="space-y-2 sm:col-span-2 flex items-center gap-4">
                  <Label className="mb-0">Direction</Label>
                  <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
                    <button
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${!formData.reverse_direction ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setFormData({ ...formData, reverse_direction: false })}
                    >
                      Forward
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${formData.reverse_direction ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setFormData({ ...formData, reverse_direction: true })}
                    >
                      Return
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  className="border-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  className="border-input"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Price (Rs.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="border-input"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
          </section>
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button type="submit" disabled={loading}>{isEdit ? 'Update' : 'Create Schedule'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/vehicle-schedules')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
