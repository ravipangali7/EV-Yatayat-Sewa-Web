import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { getWallets, getUsers, deleteWallet, deleteWallets } from '@/stores/mockData';
import { Wallet } from '@/types';
import { toast } from 'sonner';

export default function Wallets() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState(getWallets());
  const users = getUsers();

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
      render: (wallet) => `$${wallet.balance.toLocaleString()}`,
    },
    {
      key: 'to_be_pay',
      header: 'To Be Paid',
      render: (wallet) => `$${wallet.to_be_pay.toLocaleString()}`,
    },
    {
      key: 'to_be_received',
      header: 'To Be Received',
      render: (wallet) => `$${wallet.to_be_received.toLocaleString()}`,
    },
  ];

  const handleDelete = (id: string) => {
    deleteWallet(id);
    setWallets(getWallets());
    toast.success('Wallet deleted successfully');
  };

  const handleBulkDelete = (ids: string[]) => {
    deleteWallets(ids);
    setWallets(getWallets());
    toast.success(`${ids.length} wallets deleted successfully`);
  };

  return (
    <div>
      <PageHeader
        title="Wallets"
        subtitle="Manage user wallets"
        actions={
          <Button onClick={() => navigate('/app/wallets/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Wallet
          </Button>
        }
      />

      <DataTable
        data={wallets}
        columns={columns}
        searchPlaceholder="Search wallets..."
        onView={(wallet) => navigate(`/app/wallets/${wallet.id}`)}
        onEdit={(wallet) => navigate(`/app/wallets/${wallet.id}/edit`)}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
}
