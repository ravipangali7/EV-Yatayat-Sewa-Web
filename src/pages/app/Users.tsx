import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X, Users as UsersIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { userApi } from '@/modules/users/services/userApi';
import { User } from '@/types';
import { toast } from 'sonner';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<{ total_count?: number } | null>(null);
  const perPage = 25;

  // Tab: All | Driver | Dealer | Customer
  type RoleTab = 'all' | 'driver' | 'dealer' | 'customer';
  const [roleTab, setRoleTab] = useState<RoleTab>('all');

  // Input state
  const [searchInput, setSearchInput] = useState('');
  const [isActiveInput, setIsActiveInput] = useState<'all' | 'true' | 'false'>('all');
  const [isTicketDealerInput, setIsTicketDealerInput] = useState<'all' | 'true' | 'false'>('all');

  // Applied state
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedIsActive, setAppliedIsActive] = useState<'all' | 'true' | 'false'>('all');
  const [appliedIsTicketDealer, setAppliedIsTicketDealer] = useState<'all' | 'true' | 'false'>('all');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const isDriver = roleTab === 'driver' ? true : roleTab === 'customer' ? false : undefined;
      const isTicketDealer = roleTab === 'dealer' ? true : roleTab === 'customer' ? false : undefined;
      const response = await userApi.list({
        search: appliedSearch || undefined,
        is_driver: isDriver,
        is_ticket_dealer: isTicketDealer,
        is_active: appliedIsActive !== 'all' ? appliedIsActive === 'true' : undefined,
        page,
        per_page: perPage,
      });
      setUsers(response.results);
      setTotalCount(response.count);
      setStats((response as { stats?: { total_count?: number } }).stats ?? null);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedIsActive, appliedIsTicketDealer, roleTab, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedIsActive(isActiveInput);
    setAppliedIsTicketDealer(isTicketDealerInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    {
      key: 'is_driver',
      header: 'Driver',
      render: (user) =>
        user.is_driver ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground" />
        ),
    },
    {
      key: 'is_ticket_dealer',
      header: 'Dealer',
      render: (user) =>
        user.is_ticket_dealer ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground" />
        ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user) => <StatusBadge status={user.is_active ? 'active' : 'inactive'} />,
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await userApi.delete(id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => userApi.delete(id)));
      toast.success(`${ids.length} users deleted successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete users:', error);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        subtitle="Manage all system users"
        actions={
          <Button onClick={() => navigate('/admin/users/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        }
      />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <UsersIcon className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_count ?? totalCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={roleTab} onValueChange={(v) => { setRoleTab(v as RoleTab); setPage(1); }}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="driver">Driver</TabsTrigger>
          <TabsTrigger value="dealer">Dealer</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[220px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Name, phone, email…"
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
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Ticket Dealer</Label>
          <Select
            value={isTicketDealerInput}
            onValueChange={(v) => setIsTicketDealerInput(v as 'all' | 'true' | 'false')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Dealers</SelectItem>
              <SelectItem value="false">Non-dealers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading users...</div>
      ) : (
        <DataTable
          data={users}
          columns={columns}
          searchPlaceholder="Search users (name, phone, email)..."
          onView={(user) => navigate(`/admin/users/${user.id}`)}
          onEdit={(user) => navigate(`/admin/users/${user.id}/edit`)}
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
