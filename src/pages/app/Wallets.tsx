import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { walletApi } from '@/modules/wallets/services/walletApi';
import { userApi } from '@/modules/users/services/userApi';
import { Wallet, User } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function Wallets() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [walletsResponse, usersResponse] = await Promise.all([
          walletApi.list({ per_page: 1000 }),
          userApi.list({ per_page: 1000 }),
        ]);
        setWallets(walletsResponse.results);
        setUsers(usersResponse.results);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const columns: Column<Wallet>[] = [
    {
      key: 'user',
      header: 'User',
      render: (wallet) => getUserName(wallet.user),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (wallet) => `$${toNumber(wallet.balance, 0).toLocaleString()}`,
    },
    {
      key: 'to_be_pay',
      header: 'To Be Paid',
      render: (wallet) => `$${toNumber(wallet.to_be_pay, 0).toLocaleString()}`,
    },
    {
      key: 'to_be_received',
      header: 'To Be Received',
      render: (wallet) => `$${toNumber(wallet.to_be_received, 0).toLocaleString()}`,
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await walletApi.delete(id);
      setWallets(wallets.filter(wallet => wallet.id !== id));
      toast.success('Wallet deleted successfully');
    } catch (error) {
      console.error('Failed to delete wallet:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => walletApi.delete(id)));
      setWallets(wallets.filter(wallet => !ids.includes(wallet.id)));
      toast.success(`${ids.length} wallets deleted successfully`);
    } catch (error) {
      console.error('Failed to delete wallets:', error);
    }
  };

  return (
    <div>
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
        />
      )}
    </div>
  );
}
