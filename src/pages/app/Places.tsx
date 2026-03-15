import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { placeApi } from '@/modules/places/services/placeApi';
import { Place } from '@/types';
import { toast } from 'sonner';

export default function Places() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 25;

  // Input state
  const [searchInput, setSearchInput] = useState('');

  // Applied state
  const [appliedSearch, setAppliedSearch] = useState('');

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await placeApi.list({
        search: appliedSearch || undefined,
        page,
        per_page: perPage,
      });
      setPlaces(response.results);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Failed to load places:', error);
      toast.error('Failed to load places');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const columns: Column<Place>[] = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code' },
    {
      key: 'latitude',
      header: 'Coordinates',
      render: (place) => {
        const lat =
          typeof place.latitude === 'number'
            ? place.latitude
            : parseFloat(String(place.latitude || 0));
        const lng =
          typeof place.longitude === 'number'
            ? place.longitude
            : parseFloat(String(place.longitude || 0));
        if (isNaN(lat) || isNaN(lng)) return 'N/A';
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
      toast.success('Place deleted successfully');
      fetchPlaces();
    } catch (error) {
      console.error('Failed to delete place:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => placeApi.delete(id)));
      toast.success(`${ids.length} places deleted successfully`);
      fetchPlaces();
    } catch (error) {
      console.error('Failed to delete places:', error);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Places"
        subtitle="Manage locations and stops"
        actions={
          <Button onClick={() => navigate('/admin/places/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Place
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[260px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Name, code, address…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading places...</p>
        </div>
      ) : (
        <DataTable
          data={places}
          columns={columns}
          searchPlaceholder="Search places..."
          onView={(place) => navigate(`/admin/places/${place.id}`)}
          onEdit={(place) => navigate(`/admin/places/${place.id}/edit`)}
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
