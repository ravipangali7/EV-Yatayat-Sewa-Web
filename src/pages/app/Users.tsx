import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getUsers, deleteUser, deleteUsers } from '@/stores/mockData';
import { User } from '@/types';
import { toast } from 'sonner';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(getUsers());

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    {
      key: 'is_driver',
      header: 'Driver',
      render: (user) => user.is_driver ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user) => <StatusBadge status={user.is_active ? 'active' : 'inactive'} />,
    },
  ];

  const handleDelete = (id: string) => {
    deleteUser(id);
    setUsers(getUsers());
    toast.success('User deleted successfully');
  };

  const handleBulkDelete = (ids: string[]) => {
    deleteUsers(ids);
    setUsers(getUsers());
    toast.success(`${ids.length} users deleted successfully`);
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage all system users"
        actions={
          <Button onClick={() => navigate('/app/users/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        }
      />

      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search users..."
        onView={(user) => navigate(`/app/users/${user.id}`)}
        onEdit={(user) => navigate(`/app/users/${user.id}/edit`)}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
}
