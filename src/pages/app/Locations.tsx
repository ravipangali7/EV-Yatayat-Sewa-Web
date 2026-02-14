import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { locationApi, type LocationRecord } from '@/modules/locations/services/locationApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Locations() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const response = await locationApi.list({ per_page: 100 });
        setLocations(response.results || []);
      } catch {
        setLocations([]);
        toast.error('Failed to load locations');
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const columns: Column<LocationRecord>[] = [
    { key: 'vehicle', header: 'Vehicle', render: (l) => l.vehicle },
    { key: 'trip', header: 'Trip', render: (l) => l.trip || '-' },
    { key: 'latitude', header: 'Lat', render: (l) => l.latitude },
    { key: 'longitude', header: 'Lng', render: (l) => l.longitude },
    { key: 'speed', header: 'Speed', render: (l) => l.speed ?? '-' },
    { key: 'created_at', header: 'Created', render: (l) => format(new Date(l.created_at), 'MMM dd, HH:mm:ss') },
  ];

  return (
    <div>
      <PageHeader title="Locations" subtitle="Vehicle and trip location records" />
      {loading ? (
        <p className="text-muted-foreground py-8">Loading...</p>
      ) : (
        <DataTable
          data={locations}
          columns={columns}
          searchPlaceholder="Search..."
        />
      )}
    </div>
  );
}
