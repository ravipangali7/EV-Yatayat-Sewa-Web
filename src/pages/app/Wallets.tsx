import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { walletApi } from '@/modules/wallets/services/walletApi';
import { Wallet } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function Wallets() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 25;

  // Input state
  const [searchInput, setSearchInput] = useState('');

  // Applied state
  const [appliedSearch, setAppliedSearch] = useState('');

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await walletApi.list({
        search: appliedSearch || undefined,
        page,
        per_page: perPage,
      });
      setWallets(response.results);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Failed to load wallets:', error);
      toast.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const columns: Column<Wallet>[] = [
    {
      key: 'user',
      header: 'User',
      render: (wallet) =>
        wallet.user_details?.name || wallet.user_details?.phone || wallet.user || '-',
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (wallet) => `Rs. ${toNumber(wallet.balance, 0).toLocaleString()}`,
    },
    {
      key: 'to_pay',
      header: 'To Pay',
      render: (wallet) => `Rs. ${toNumber(wallet.to_pay, 0).toLocaleString()}`,
    },
    {
      key: 'to_receive',
      header: 'To Receive',
      render: (wallet) => `Rs. ${toNumber(wallet.to_receive, 0).toLocaleString()}`,
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await walletApi.delete(id);
      toast.success('Wallet deleted successfully');
      fetchWallets();
    } catch (error) {
      console.error('Failed to delete wallet:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => walletApi.delete(id)));
      toast.success(`${ids.length} wallets deleted successfully`);
      fetchWallets();
    } catch (error) {
      console.error('Failed to delete wallets:', error);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Wallets"
        subtitle="Manage user wallets"
        actions={
          <Button onClick={() => navigate('/admin/wallets/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Wallet
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[220px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="User name or phone…"
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
          <p className="text-muted-foreground">Loading wallets...</p>
        </div>
      ) : (
        <DataTable
          data={wallets}
          columns={columns}
          searchPlaceholder="Search wallets..."
          onView={(wallet) => navigate(`/admin/wallets/${wallet.id}`)}
          onEdit={(wallet) => navigate(`/admin/wallets/${wallet.id}/edit`)}
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
