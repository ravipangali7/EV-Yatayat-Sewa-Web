import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { getTransactions, getUsers, deleteTransaction, deleteTransactions } from '@/stores/mockData';
import { Transaction } from '@/types';
import { toast } from 'sonner';

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState(getTransactions());
  const users = getUsers();

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
          {tx.type === 'add' ? '+' : '-'}${tx.amount.toLocaleString()}
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

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setTransactions(getTransactions());
    toast.success('Transaction deleted successfully');
  };

  const handleBulkDelete = (ids: string[]) => {
    deleteTransactions(ids);
    setTransactions(getTransactions());
    toast.success(`${ids.length} transactions deleted successfully`);
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="View and manage transactions"
      />

      <DataTable
        data={transactions}
        columns={columns}
        searchPlaceholder="Search transactions..."
        onView={(tx) => navigate(`/app/transactions/${tx.id}`)}
        onEdit={(tx) => navigate(`/app/transactions/${tx.id}/edit`)}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
}
