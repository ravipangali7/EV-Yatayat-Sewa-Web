import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { tripApi } from '@/modules/trips/services/tripApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TripRow {
  id: string;
  trip_id: string;
  vehicle: string;
  driver: string;
  route: string;
  start_time: string | null;
  end_time: string | null;
  remarks: string;
  is_scheduled: boolean;
  created_at: string;
}

export default function Trips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        const response = await tripApi.list({ per_page: 100 });
        setTrips((response.results || []) as TripRow[]);
      } catch {
        toast.error('Failed to load trips');
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const columns: Column<TripRow>[] = [
    { key: 'trip_id', header: 'Trip ID', render: (t) => t.trip_id },
    { key: 'vehicle', header: 'Vehicle', render: (t) => t.vehicle },
    { key: 'driver', header: 'Driver', render: (t) => t.driver },
    { key: 'route', header: 'Route', render: (t) => t.route },
    {
      key: 'start_time',
      header: 'Start',
      render: (t) => (t.start_time ? format(new Date(t.start_time), 'MMM dd, HH:mm') : '-'),
    },
    {
      key: 'end_time',
      header: 'End',
      render: (t) => (t.end_time ? format(new Date(t.end_time), 'MMM dd, HH:mm') : 'Active'),
    },
    { key: 'is_scheduled', header: 'Scheduled', render: (t) => (t.is_scheduled ? 'Yes' : 'No') },
  ];

  return (
    <div>
      <PageHeader title="Trips" subtitle="Trip history and active trips" />
      {loading ? (
        <p className="text-muted-foreground py-8">Loading...</p>
      ) : (
        <DataTable
          data={trips}
          columns={columns}
          searchPlaceholder="Search trips..."
          onView={(t) => navigate(`/admin/trips/${t.id}`)}
        />
      )}
    </div>
  );
}
