import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<{ total_count?: number; sum_amount?: string } | null>(null);
  const perPage = 25;
  type RoleTab = 'all' | 'driver' | 'dealer' | 'customer';
  const [roleTab, setRoleTab] = useState<RoleTab>('all');

  // Input state
  const [searchInput, setSearchInput] = useState('');
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [statusInput, setStatusInput] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
  const [typeInput, setTypeInput] = useState<'all' | 'add' | 'deducted'>('all');

  // Applied state
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
  const [appliedType, setAppliedType] = useState<'all' | 'add' | 'deducted'>('all');
  const [isPolling, setIsPolling] = useState(false);
  const pollingInFlightRef = useRef(false);

  const fetchTransactions = useCallback(async (isBackground = false) => {
    if (isBackground) {
      if (pollingInFlightRef.current) return;
      pollingInFlightRef.current = true;
      setIsPolling(true);
    } else {
      setLoading(true);
    }
    try {
      const isDriver = roleTab === 'driver' ? true : roleTab === 'customer' ? false : undefined;
      const isTicketDealer = roleTab === 'dealer' ? true : roleTab === 'customer' ? false : undefined;
      const response = (await transactionApi.list({
        search: appliedSearch || undefined,
        date_from: appliedDateFrom || undefined,
        date_to: appliedDateTo || undefined,
        status: appliedStatus !== 'all' ? appliedStatus : undefined,
        type: appliedType !== 'all' ? appliedType : undefined,
        is_driver: isDriver,
        is_ticket_dealer: isTicketDealer,
        page,
        per_page: perPage,
      })) as { results: TransactionWithDetails[]; count: number; stats?: { total_count?: number; sum_amount?: string } };
      setTransactions(response.results);
      setTotalCount(response.count);
      setStats(response.stats ?? null);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      if (isBackground) {
        pollingInFlightRef.current = false;
        setIsPolling(false);
      } else {
        setLoading(false);
      }
    }
  }, [appliedSearch, appliedDateFrom, appliedDateTo, appliedStatus, appliedType, page, roleTab]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchTransactions(true);
    }, 12_000);
    return () => clearInterval(id);
  }, [fetchTransactions]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedDateFrom(dateFromInput);
    setAppliedDateTo(dateToInput);
    setAppliedStatus(statusInput);
    setAppliedType(typeInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const columns: Column<TransactionWithDetails>[] = [
    {
      key: 'user',
      header: 'User',
      render: (tx) =>
        (tx as TransactionWithDetails).user_details?.name ||
        (tx as TransactionWithDetails).user_details?.phone ||
        tx.user,
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
    { key: 'remarks', header: 'Remarks', render: (tx) => (
      <span className="line-clamp-2 max-w-xs text-xs">{tx.remarks || '-'}</span>
    )},
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
      await Promise.all(ids.map((id) => transactionApi.delete(id)));
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

      <Tabs value={roleTab} onValueChange={(v) => { setRoleTab(v as RoleTab); setPage(1); }}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="driver">Driver</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="dealer">Dealer</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[220px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Remarks, user name or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">From Date</Label>
          <Input
            type="date"
            value={dateFromInput}
            onChange={(e) => setDateFromInput(e.target.value)}
            className="w-[145px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">To Date</Label>
          <Input
            type="date"
            value={dateToInput}
            onChange={(e) => setDateToInput(e.target.value)}
            className="w-[145px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={statusInput}
            onValueChange={(v) => setStatusInput(v as 'all' | 'pending' | 'success' | 'failed')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={typeInput}
            onValueChange={(v) => setTypeInput(v as 'all' | 'add' | 'deducted')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="add">Credit</SelectItem>
              <SelectItem value="deducted">Debit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
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
