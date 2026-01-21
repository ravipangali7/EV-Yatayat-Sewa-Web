import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getVehicles, deleteVehicle, deleteVehicles } from '@/stores/mockData';
import { Vehicle } from '@/types';
import { toast } from 'sonner';

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState(getVehicles());

  const columns: Column<Vehicle>[] = [
    { key: 'name', header: 'Name' },
    { key: 'vehicle_no', header: 'Vehicle No' },
    { key: 'vehicle_type', header: 'Type' },
    {
      key: 'odometer',
      header: 'Odometer',
      render: (vehicle) => `${vehicle.odometer.toLocaleString()} km`,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (vehicle) => <StatusBadge status={vehicle.is_active ? 'active' : 'inactive'} />,
    },
  ];

  const handleDelete = (id: string) => {
    deleteVehicle(id);
    setVehicles(getVehicles());
    toast.success('Vehicle deleted successfully');
  };

  const handleBulkDelete = (ids: string[]) => {
    deleteVehicles(ids);
    setVehicles(getVehicles());
    toast.success(`${ids.length} vehicles deleted successfully`);
  };

  return (
    <div>
      <PageHeader
        title="Vehicles"
        subtitle="Manage fleet vehicles"
        actions={
          <Button onClick={() => navigate('/app/vehicles/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        }
      />

      <DataTable
        data={vehicles}
        columns={columns}
        searchPlaceholder="Search vehicles..."
        onView={(vehicle) => navigate(`/app/vehicles/${vehicle.id}`)}
        onEdit={(vehicle) => navigate(`/app/vehicles/${vehicle.id}/edit`)}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
}
