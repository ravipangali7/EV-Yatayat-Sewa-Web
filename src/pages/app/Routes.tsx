import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { routeApi } from '@/modules/routes/services/routeApi';
import { Route } from '@/types';
import { toast } from 'sonner';

export default function Routes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 25;

  // Input state
  const [searchInput, setSearchInput] = useState('');
  const [isBidirectionalInput, setIsBidirectionalInput] = useState<'all' | 'true' | 'false'>('all');

  // Applied state
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedIsBidirectional, setAppliedIsBidirectional] = useState<'all' | 'true' | 'false'>('all');

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await routeApi.list({
        search: appliedSearch || undefined,
        is_bidirectional:
          appliedIsBidirectional !== 'all' ? appliedIsBidirectional === 'true' : undefined,
        page,
        per_page: perPage,
      });
      setRoutes(response.results);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Failed to load routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedIsBidirectional, page]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedIsBidirectional(isBidirectionalInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

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
      render: (route) =>
        route.is_bidirectional ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground" />
        ),
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await routeApi.delete(id);
      toast.success('Route deleted successfully');
      fetchRoutes();
    } catch (error) {
      console.error('Failed to delete route:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => routeApi.delete(id)));
      toast.success(`${ids.length} routes deleted successfully`);
      fetchRoutes();
    } catch (error) {
      console.error('Failed to delete routes:', error);
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[220px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Route name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Direction</Label>
          <Select
            value={isBidirectionalInput}
            onValueChange={(v) => setIsBidirectionalInput(v as 'all' | 'true' | 'false')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Bidirectional</SelectItem>
              <SelectItem value="false">One-way</SelectItem>
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
