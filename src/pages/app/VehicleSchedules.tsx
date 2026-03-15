import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { vehicleScheduleApi, type VehicleScheduleRecord } from '@/modules/vehicle-schedules/services/vehicleScheduleApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VehicleSchedules() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<VehicleScheduleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 25;

  // Input state
  const [searchInput, setSearchInput] = useState('');
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');

  // Applied state
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await vehicleScheduleApi.list({
        search: appliedSearch || undefined,
        date_from: appliedDateFrom || undefined,
        date_to: appliedDateTo || undefined,
        page,
        per_page: perPage,
      });
      setSchedules((response.results || []) as VehicleScheduleRecord[]);
      setTotalCount(response.count);
    } catch {
      toast.error('Failed to load vehicle schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedDateFrom, appliedDateTo, page]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedDateFrom(dateFromInput);
    setAppliedDateTo(dateToInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const columns: Column<VehicleScheduleRecord>[] = [
    { key: 'vehicle', header: 'Vehicle', render: (s) => s.vehicle },
    { key: 'route', header: 'Route', render: (s) => s.route + (s.reverse_direction ? ' (Return)' : '') },
    { key: 'date', header: 'Date', render: (s) => format(new Date(s.date), 'MMM dd, yyyy') },
    { key: 'time', header: 'Time', render: (s) => s.time },
    { key: 'price', header: 'Price', render: (s) => `Rs. ${Number(s.price).toFixed(2)}` },
  ];

  const handleDelete = async (id: string) => {
    try {
      await vehicleScheduleApi.delete(id);
      toast.success('Vehicle schedule deleted');
      fetchSchedules();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => vehicleScheduleApi.delete(id)));
      toast.success(`${ids.length} schedules deleted`);
      fetchSchedules();
    } catch {
      toast.error('Failed to delete schedules');
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[220px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Vehicle, route, time…"
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
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>

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
          onBulkDelete={handleBulkDelete}
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
