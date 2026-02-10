import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { transactionApi } from '@/modules/transactions/services/transactionApi';
import { userApi } from '@/modules/users/services/userApi';
import { Transaction, User } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [transactionsResponse, usersResponse] = await Promise.all([
          transactionApi.list({ per_page: 1000 }),
          userApi.list({ per_page: 1000 }),
        ]);
        setTransactions(transactionsResponse.results);
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

  const columns: Column<Transaction>[] = [
    {
      key: 'user',
      header: 'User',
      render: (tx) => getUserName(tx.user),
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
          {tx.type === 'add' ? '+' : '-'}${toNumber(tx.amount, 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (tx) => <StatusBadge status={tx.status} />,
    },
    { key: 'remarks', header: 'Remarks' },
  ];

  const handleDelete = async (id: string) => {
    try {
      await transactionApi.delete(id);
      setTransactions(transactions.filter(tx => tx.id !== id));
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => transactionApi.delete(id)));
      setTransactions(transactions.filter(tx => !ids.includes(tx.id)));
      toast.success(`${ids.length} transactions deleted successfully`);
    } catch (error) {
      console.error('Failed to delete transactions:', error);
    }
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="View and manage transactions"
      />

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      ) : (
        <DataTable
          data={transactions}
          columns={columns}
          searchPlaceholder="Search transactions..."
          onView={(tx) => navigate(`/admin/transactions/${tx.id}`)}
          onEdit={(tx) => navigate(`/admin/transactions/${tx.id}/edit`)}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />
      )}
    </div>
  );
}
