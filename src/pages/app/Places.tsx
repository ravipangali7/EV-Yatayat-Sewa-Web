import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { placeApi } from '@/modules/places/services/placeApi';
import { Place } from '@/types';
import { toast } from 'sonner';

export default function Places() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const response = await placeApi.list({ per_page: 1000 });
        setPlaces(response.results);
      } catch (error) {
        console.error('Failed to load places:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  const columns: Column<Place>[] = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code' },
    {
      key: 'latitude',
      header: 'Coordinates',
      render: (place) => {
        const lat = typeof place.latitude === 'number' ? place.latitude : parseFloat(String(place.latitude || 0));
        const lng = typeof place.longitude === 'number' ? place.longitude : parseFloat(String(place.longitude || 0));
        if (isNaN(lat) || isNaN(lng)) {
          return 'N/A';
        }
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      },
    },
    {
      key: 'address',
      header: 'Address',
      render: (place) => (
        <span className="line-clamp-1 max-w-xs">{place.address}</span>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await placeApi.delete(id);
      setPlaces(places.filter(place => place.id !== id));
      toast.success('Place deleted successfully');
    } catch (error) {
      console.error('Failed to delete place:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => placeApi.delete(id)));
      setPlaces(places.filter(place => !ids.includes(place.id)));
      toast.success(`${ids.length} places deleted successfully`);
    } catch (error) {
      console.error('Failed to delete places:', error);
    }
  };

  return (
    <div>
      <PageHeader
        title="Places"
        subtitle="Manage locations and stops"
        actions={
          <Button onClick={() => navigate('/app/places/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Place
          </Button>
        }
      />

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading places...</p>
        </div>
      ) : (
        <DataTable
          data={places}
          columns={columns}
          searchPlaceholder="Search places..."
          onView={(place) => navigate(`/app/places/${place.id}`)}
          onEdit={(place) => navigate(`/app/places/${place.id}/edit`)}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />
      )}
    </div>
  );
}
