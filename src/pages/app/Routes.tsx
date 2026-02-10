import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { routeApi } from '@/modules/routes/services/routeApi';
import { Route } from '@/types';
import { toast } from 'sonner';

export default function Routes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const routesResponse = await routeApi.list({ per_page: 1000 });
        setRoutes(routesResponse.results);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns: Column<Route>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'start_point',
      header: 'Start Point',
      render: (route) => route.start_point_details?.name || 'Unknown',
    },
    {
      key: 'end_point',
      header: 'End Point',
      render: (route) => route.end_point_details?.name || 'Unknown',
    },
    {
      key: 'is_bidirectional',
      header: 'Bidirectional',
      render: (route) => route.is_bidirectional ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />,
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await routeApi.delete(id);
      setRoutes(routes.filter(route => route.id !== id));
      toast.success('Route deleted successfully');
    } catch (error) {
      console.error('Failed to delete route:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => routeApi.delete(id)));
      setRoutes(routes.filter(route => !ids.includes(route.id)));
      toast.success(`${ids.length} routes deleted successfully`);
    } catch (error) {
      console.error('Failed to delete routes:', error);
    }
  };

  return (
    <div>
      <PageHeader
        title="Routes"
        subtitle="Manage travel routes"
        actions={
          <Button onClick={() => navigate('/admin/routes/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Route
          </Button>
        }
      />

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading routes...</p>
        </div>
      ) : (
        <DataTable
          data={routes}
          columns={columns}
          searchPlaceholder="Search routes..."
          onView={(route) => navigate(`/admin/routes/${route.id}`)}
          onEdit={(route) => navigate(`/admin/routes/${route.id}/edit`)}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />
      )}
    </div>
  );
}
