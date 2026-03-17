import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { tripApi } from '@/modules/trips/services/tripApi';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { userApi } from '@/modules/users/services/userApi';
import { routeApi } from '@/modules/routes/services/routeApi';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Vehicle, User, Route } from '@/types';

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
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<{ total_count?: number } | null>(null);
  const perPage = 25;

  // Dropdown options
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  // Input state
  const [searchInput, setSearchInput] = useState('');
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [vehicleInput, setVehicleInput] = useState<string>('__all__');
  const [driverInput, setDriverInput] = useState<string>('__all__');
  const [routeInput, setRouteInput] = useState<string>('__all__');
  const [isScheduledInput, setIsScheduledInput] = useState<'all' | 'true' | 'false'>('all');

  // Applied state
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [appliedVehicle, setAppliedVehicle] = useState<string>('__all__');
  const [appliedDriver, setAppliedDriver] = useState<string>('__all__');
  const [appliedRoute, setAppliedRoute] = useState<string>('__all__');
  const [appliedIsScheduled, setAppliedIsScheduled] = useState<'all' | 'true' | 'false'>('all');

  // Load dropdown options once
  useEffect(() => {
    vehicleApi.list({ per_page: 500 }).then((r) => setVehicles(r.results)).catch(() => {});
    userApi.list({ is_driver: true, per_page: 500 }).then((r) => setDrivers(r.results)).catch(() => {});
    routeApi.list({ per_page: 500 }).then((r) => setRoutes(r.results)).catch(() => {});
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tripApi.list({
        search: appliedSearch || undefined,
        date_from: appliedDateFrom || undefined,
        date_to: appliedDateTo || undefined,
        vehicle: appliedVehicle && appliedVehicle !== '__all__' ? appliedVehicle : undefined,
        driver: appliedDriver && appliedDriver !== '__all__' ? appliedDriver : undefined,
        route: appliedRoute && appliedRoute !== '__all__' ? appliedRoute : undefined,
        ...(appliedIsScheduled !== 'all'
          ? { is_scheduled: appliedIsScheduled === 'true' }
          : {}),
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
  }, [
    appliedSearch,
    appliedDateFrom,
    appliedDateTo,
    appliedVehicle,
    appliedDriver,
    appliedRoute,
    appliedIsScheduled,
    page,
  ]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedDateFrom(dateFromInput);
    setAppliedDateTo(dateToInput);
    setAppliedVehicle(vehicleInput);
    setAppliedDriver(driverInput);
    setAppliedRoute(routeInput);
    setAppliedIsScheduled(isScheduledInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const columns: Column<TripRow>[] = [
    { key: 'trip_id', header: 'Trip ID', render: (t) => t.trip_id },
    { key: 'vehicle', header: 'Vehicle', render: (t) => t.vehicle_no || t.vehicle_name || t.vehicle },
    { key: 'driver', header: 'Driver', render: (t) => t.driver_name || t.driver_phone || t.driver },
    {
      key: 'route',
      header: 'Route',
      render: (t) => (t.route_name || t.route) + (t.reverse_direction ? ' (Return)' : ''),
    },
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

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[200px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Trip ID, remarks…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">From Date</Label>
          <Input
            type="date"
            value={dateFromInput}
            onChange={(e) => setDateFromInput(e.target.value)}
            className="w-[145px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">To Date</Label>
          <Input
            type="date"
            value={dateToInput}
            onChange={(e) => setDateToInput(e.target.value)}
            className="w-[145px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Vehicle</Label>
          <Select value={vehicleInput} onValueChange={setVehicleInput}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All vehicles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All vehicles</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.vehicle_no} — {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Driver</Label>
          <Select value={driverInput} onValueChange={setDriverInput}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All drivers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All drivers</SelectItem>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name || d.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Route</Label>
          <Select value={routeInput} onValueChange={setRouteInput}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All routes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All routes</SelectItem>
              {routes.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={isScheduledInput}
            onValueChange={(v) => setIsScheduledInput(v as 'all' | 'true' | 'false')}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Scheduled</SelectItem>
              <SelectItem value="false">On-demand</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
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
          onSearchChange={(v) => setSearchInput(v)}
          totalCount={totalCount}
          page={page}
          onPageChange={setPage}
          perPage={perPage}
        />
      )}
    </div>
  );
}
