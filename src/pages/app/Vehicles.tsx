import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { Vehicle } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 25;

  // Input state
  const [searchInput, setSearchInput] = useState('');
  const [isActiveInput, setIsActiveInput] = useState<'all' | 'true' | 'false'>('all');

  // Applied state
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedIsActive, setAppliedIsActive] = useState<'all' | 'true' | 'false'>('all');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await vehicleApi.list({
        search: appliedSearch || undefined,
        is_active: appliedIsActive !== 'all' ? appliedIsActive === 'true' : undefined,
        page,
        per_page: perPage,
      });
      setVehicles(response.results);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedIsActive, page]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedIsActive(isActiveInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const columns: Column<Vehicle>[] = [
    { key: 'name', header: 'Name' },
    { key: 'vehicle_no', header: 'Vehicle No' },
    { key: 'vehicle_type', header: 'Type' },
    {
      key: 'odometer',
      header: 'Odometer',
      render: (vehicle) => `${toNumber(vehicle.odometer, 0).toLocaleString()} km`,
    },
    {
      key: 'active_driver_details',
      header: 'Active Driver',
      render: (vehicle) =>
        vehicle.active_driver_details?.name ||
        vehicle.active_driver_details?.phone ||
        '-',
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (vehicle) => <StatusBadge status={vehicle.is_active ? 'active' : 'inactive'} />,
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await vehicleApi.delete(id);
      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => vehicleApi.delete(id)));
      toast.success(`${ids.length} vehicles deleted successfully`);
      fetchVehicles();
    } catch (error) {
      console.error('Failed to delete vehicles:', error);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vehicles"
        subtitle="Manage fleet vehicles"
        actions={
          <Button onClick={() => navigate('/admin/vehicles/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[220px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Name, vehicle no, type…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Status</Label>
          <Select value={isActiveInput} onValueChange={(v) => setIsActiveInput(v as 'all' | 'true' | 'false')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading vehicles...</p>
        </div>
      ) : (
        <DataTable
          data={vehicles}
          columns={columns}
          searchPlaceholder="Search vehicles..."
          onView={(vehicle) => navigate(`/admin/vehicles/${vehicle.id}`)}
          onEdit={(vehicle) => navigate(`/admin/vehicles/${vehicle.id}/edit`)}
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
