import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { getRoutes, getPlaces, deleteRoute, deleteRoutes } from '@/stores/mockData';
import { Route } from '@/types';
import { toast } from 'sonner';

export default function Routes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState(getRoutes());
  const places = getPlaces();

  const getPlaceName = (placeId: string) => {
    const place = places.find(p => p.id === placeId);
    return place?.name || 'Unknown';
  };

  const columns: Column<Route>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'start_point',
      header: 'Start Point',
      render: (route) => getPlaceName(route.start_point),
    },
    {
      key: 'end_point',
      header: 'End Point',
      render: (route) => getPlaceName(route.end_point),
    },
    {
      key: 'is_bidirectional',
      header: 'Bidirectional',
      render: (route) => route.is_bidirectional ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />,
    },
  ];

  const handleDelete = (id: string) => {
    deleteRoute(id);
    setRoutes(getRoutes());
    toast.success('Route deleted successfully');
  };

  const handleBulkDelete = (ids: string[]) => {
    deleteRoutes(ids);
    setRoutes(getRoutes());
    toast.success(`${ids.length} routes deleted successfully`);
  };

  return (
    <div>
      <PageHeader
        title="Routes"
        subtitle="Manage travel routes"
        actions={
          <Button onClick={() => navigate('/app/routes/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Route
          </Button>
        }
      />

      <DataTable
        data={routes}
        columns={columns}
        searchPlaceholder="Search routes..."
        onView={(route) => navigate(`/app/routes/${route.id}`)}
        onEdit={(route) => navigate(`/app/routes/${route.id}/edit`)}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
}
