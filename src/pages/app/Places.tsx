import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { getPlaces, deletePlace, deletePlaces } from '@/stores/mockData';
import { Place } from '@/types';
import { toast } from 'sonner';

export default function Places() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState(getPlaces());

  const columns: Column<Place>[] = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code' },
    {
      key: 'latitude',
      header: 'Coordinates',
      render: (place) => `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`,
    },
    {
      key: 'address',
      header: 'Address',
      render: (place) => (
        <span className="line-clamp-1 max-w-xs">{place.address}</span>
      ),
    },
  ];

  const handleDelete = (id: string) => {
    deletePlace(id);
    setPlaces(getPlaces());
    toast.success('Place deleted successfully');
  };

  const handleBulkDelete = (ids: string[]) => {
    deletePlaces(ids);
    setPlaces(getPlaces());
    toast.success(`${ids.length} places deleted successfully`);
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

      <DataTable
        data={places}
        columns={columns}
        searchPlaceholder="Search places..."
        onView={(place) => navigate(`/app/places/${place.id}`)}
        onEdit={(place) => navigate(`/app/places/${place.id}/edit`)}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
}
