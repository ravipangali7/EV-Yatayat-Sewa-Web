import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const response = await vehicleApi.list({ per_page: 1000 });
        setVehicles(response.results);
      } catch (error) {
        console.error('Failed to load vehicles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

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
      key: 'is_active',
      header: 'Status',
      render: (vehicle) => <StatusBadge status={vehicle.is_active ? 'active' : 'inactive'} />,
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await vehicleApi.delete(id);
      setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
      toast.success('Vehicle deleted successfully');
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => vehicleApi.delete(id)));
      setVehicles(vehicles.filter(vehicle => !ids.includes(vehicle.id)));
      toast.success(`${ids.length} vehicles deleted successfully`);
    } catch (error) {
      console.error('Failed to delete vehicles:', error);
    }
  };

  return (
    <div>
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
        />
      )}
    </div>
  );
}
