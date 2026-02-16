import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<{ total_count?: number } | null>(null);
  const perPage = 25;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await cardApi.list({ search: search || undefined, page, per_page: perPage });
      setCards(response.results);
      setTotalCount(response.count);
      setStats((response as { stats?: { total_count?: number } }).stats ?? null);
    } catch (error) {
      console.error('Failed to load cards:', error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const columns: Column<CardWithUserDetails>[] = [
    { key: 'card_number', header: 'Card Number', render: (c) => <span className="font-mono">{c.card_number}</span> },
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
          serverSide
          searchValue={searchInput}
          onSearchChange={(v) => { setSearchInput(v); setPage(1); }}
          totalCount={totalCount}
          page={page}
          onPageChange={setPage}
          perPage={perPage}
        />
      )}
    </div>
  );
}
