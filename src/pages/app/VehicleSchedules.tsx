import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { vehicleScheduleApi, type VehicleScheduleRecord } from '@/modules/vehicle-schedules/services/vehicleScheduleApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VehicleSchedules() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<VehicleScheduleRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const response = await vehicleScheduleApi.list({ per_page: 1000 });
        setSchedules(response.results || []);
      } catch {
        toast.error('Failed to load vehicle schedules');
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const columns: Column<VehicleScheduleRecord>[] = [
    { key: 'vehicle', header: 'Vehicle', render: (s) => s.vehicle },
    { key: 'route', header: 'Route', render: (s) => s.route },
    { key: 'date', header: 'Date', render: (s) => format(new Date(s.date), 'MMM dd, yyyy') },
    { key: 'time', header: 'Time', render: (s) => s.time },
    { key: 'price', header: 'Price', render: (s) => `Rs. ${Number(s.price).toFixed(2)}` },
  ];

  const handleDelete = async (id: string) => {
    try {
      await vehicleScheduleApi.delete(id);
      setSchedules(schedules.filter((s) => s.id !== id));
      toast.success('Vehicle schedule deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader
        title="Vehicle Schedules"
        subtitle="Scheduled trips"
        actions={
          <Button onClick={() => navigate('/admin/vehicle-schedules/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        }
      />
      {loading ? (
        <p className="text-muted-foreground py-8">Loading...</p>
      ) : (
        <DataTable
          data={schedules}
          columns={columns}
          searchPlaceholder="Search schedules..."
          onView={(s) => navigate(`/admin/vehicle-schedules/${s.id}`)}
          onEdit={(s) => navigate(`/admin/vehicle-schedules/${s.id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
