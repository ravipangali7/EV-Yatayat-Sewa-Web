import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cardApi, CardWithUserDetails } from '@/modules/cards/services/cardApi';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function Cards() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<CardWithUserDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<{ total_count?: number } | null>(null);
  const perPage = 25;

  // Input state
  const [searchInput, setSearchInput] = useState('');
  const [isActiveInput, setIsActiveInput] = useState<'all' | 'true' | 'false'>('all');

  // Applied state
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedIsActive, setAppliedIsActive] = useState<'all' | 'true' | 'false'>('all');

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await cardApi.list({
        search: appliedSearch || undefined,
        is_active: appliedIsActive !== 'all' ? appliedIsActive === 'true' : undefined,
        page,
        per_page: perPage,
      });
      setCards(response.results);
      setTotalCount(response.count);
      setStats((response as { stats?: { total_count?: number } }).stats ?? null);
    } catch (error) {
      console.error('Failed to load cards:', error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedIsActive, page]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedIsActive(isActiveInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const columns: Column<CardWithUserDetails>[] = [
    {
      key: 'card_number',
      header: 'Card Number',
      render: (c) => <span className="font-mono">{c.card_number}</span>,
    },
    {
      key: 'user',
      header: 'User',
      render: (c) => c.user_details?.name || c.user_details?.phone || c.user || '-',
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (c) => `Rs. ${toNumber(c.balance, 0).toLocaleString()}`,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (c) => <StatusBadge status={c.is_active ? 'active' : 'inactive'} />,
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await cardApi.delete(id);
      toast.success('Card deleted');
      fetchCards();
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => cardApi.delete(id)));
      toast.success(`${ids.length} cards deleted`);
      fetchCards();
    } catch (error) {
      console.error('Failed to delete cards:', error);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cards"
        subtitle="Manage user cards"
        actions={
          <Button onClick={() => navigate('/admin/cards/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
        }
      />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <UICard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cards</CardTitle>
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_count ?? totalCount}</div>
            </CardContent>
          </UICard>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[220px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Card number, user name or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={isActiveInput}
            onValueChange={(v) => setIsActiveInput(v as 'all' | 'true' | 'false')}
          >
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
        <div className="text-center py-12 text-muted-foreground">Loading cards...</div>
      ) : (
        <DataTable
          data={cards}
          columns={columns}
          searchPlaceholder="Search by card number or user..."
          onView={(c) => navigate(`/admin/cards/${c.id}`)}
          onEdit={(c) => navigate(`/admin/cards/${c.id}/edit`)}
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
