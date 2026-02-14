import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { vehicleScheduleApi } from '@/modules/vehicle-schedules/services/vehicleScheduleApi';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { routeApi } from '@/modules/routes/services/routeApi';
import { toast } from 'sonner';

export default function VehicleScheduleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Array<{ id: string; name: string }>>([]);
  const [routes, setRoutes] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    vehicle: '',
    route: '',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    price: 0,
  });

  useEffect(() => {
    Promise.all([
      vehicleApi.list({ per_page: 500 }).then((r) => r.results.map((v) => ({ id: v.id, name: v.name }))),
      routeApi.list({ per_page: 500 }).then((r) => r.results.map((rte) => ({ id: rte.id, name: rte.name }))),
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
        await vehicleScheduleApi.edit(id, formData);
        toast.success('Schedule updated');
      } else {
        await vehicleScheduleApi.create(formData);
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
                <select
                  className="w-full border border-input rounded-md px-3 py-2 bg-background"
                  value={formData.vehicle}
                  onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                  required
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Route</Label>
                <select
                  className="w-full border border-input rounded-md px-3 py-2 bg-background"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  required
                >
                  <option value="">Select route</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
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
