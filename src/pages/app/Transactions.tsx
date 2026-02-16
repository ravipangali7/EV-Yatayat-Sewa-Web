import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { transactionApi } from '@/modules/transactions/services/transactionApi';
import { Transaction } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

interface TransactionWithDetails extends Transaction {
  user_details?: { name?: string; phone?: string };
  stats?: { total_count?: number; sum_amount?: string };
}

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stats, setStats] = useState<{ total_count?: number; sum_amount?: string } | null>(null);
  const perPage = 25;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await transactionApi.list({
        search: search || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: perPage,
      }) as { results: TransactionWithDetails[]; count: number; stats?: { total_count?: number; sum_amount?: string } };
      setTransactions(response.results);
      setTotalCount(response.count);
      setStats(response.stats ?? null);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const columns: Column<TransactionWithDetails>[] = [
    {
      key: 'user',
      header: 'User',
      render: (tx) => (tx as TransactionWithDetails).user_details?.name || (tx as TransactionWithDetails).user_details?.phone || tx.user,
    },
    {
      key: 'type',
      header: 'Type',
      render: (tx) => (
        <Badge variant={tx.type === 'add' ? 'default' : 'secondary'}>
          {tx.type === 'add' ? 'Credit' : 'Debit'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx) => (
        <span className={tx.type === 'add' ? 'text-success' : 'text-destructive'}>
          {tx.type === 'add' ? '+' : '-'} Rs.{toNumber(tx.amount, 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (tx) => <StatusBadge status={tx.status} />,
    },
    { key: 'remarks', header: 'Remarks', render: (tx) => tx.remarks || '-' },
  ];

  const handleDelete = async (id: string) => {
    try {
      await transactionApi.delete(id);
      toast.success('Transaction deleted successfully');
      fetchTransactions();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => transactionApi.delete(id)));
      toast.success(`${ids.length} transactions deleted successfully`);
      fetchTransactions();
    } catch (error) {
      console.error('Failed to delete transactions:', error);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Transactions" subtitle="View and manage transactions" />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Count</CardTitle>
              <Receipt className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_count ?? totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sum Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {toNumber(stats.sum_amount, 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-[140px]" />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">To</Label>
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-[140px]" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading transactions...</div>
      ) : (
        <DataTable
          data={transactions}
          columns={columns}
          searchPlaceholder="Search by remarks or user..."
          onView={(tx) => navigate(`/admin/transactions/${tx.id}`)}
          onEdit={(tx) => navigate(`/admin/transactions/${tx.id}/edit`)}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
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
