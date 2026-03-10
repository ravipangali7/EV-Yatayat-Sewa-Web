import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { tripApi } from '@/modules/trips/services/tripApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TripRow {
  id: string;
  trip_id: string;
  vehicle: string;
  vehicle_name?: string;
  vehicle_no?: string;
  driver: string;
  driver_name?: string;
  driver_phone?: string;
  route: string;
  route_name?: string;
  start_time: string | null;
  end_time: string | null;
  remarks: string;
  is_scheduled: boolean;
  reverse_direction?: boolean;
  created_at: string;
}

export default function Trips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stats, setStats] = useState<{ total_count?: number } | null>(null);
  const perPage = 25;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tripApi.list({
        search: search || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: perPage,
      });
      setTrips((response.results || []) as TripRow[]);
      setTotalCount(response.count);
      setStats(response.stats ?? null);
    } catch {
      toast.error('Failed to load trips');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const columns: Column<TripRow>[] = [
    { key: 'trip_id', header: 'Trip ID', render: (t) => t.trip_id },
    { key: 'vehicle', header: 'Vehicle', render: (t) => t.vehicle_no || t.vehicle_name || t.vehicle },
    { key: 'driver', header: 'Driver', render: (t) => t.driver_name || t.driver_phone || t.driver },
    { key: 'route', header: 'Route', render: (t) => (t.route_name || t.route) + (t.reverse_direction ? ' (Return)' : '') },
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
    <div className="space-y-4">
      <PageHeader title="Trips" subtitle="Trip history and active trips" />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trips</CardTitle>
              <Car className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_count ?? totalCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-[140px]" />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">To</Label>
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-[140px]" />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8">Loading...</p>
      ) : (
        <DataTable
          data={trips}
          columns={columns}
          searchPlaceholder="Search by trip ID..."
          onView={(t) => navigate(`/admin/trips/${t.id}`)}
          serverSide
          searchValue={searchInput}
          onSearchChange={(v) => { setSearchInput(v); setPage(1); }}
          totalCount={totalCount}
          page={page}
          onPageChange={setPage}
          perPage={perPage}
        />
      )}
    </div>
  );
}
