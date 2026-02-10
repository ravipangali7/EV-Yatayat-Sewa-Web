import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { userApi } from '@/modules/users/services/userApi';
import { User } from '@/types';
import { toast } from 'sonner';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await userApi.list({ per_page: 1000 });
        setUsers(response.results);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

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

  const handleDelete = async (id: string) => {
    try {
      await userApi.delete(id);
      setUsers(users.filter(user => user.id !== id));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => userApi.delete(id)));
      setUsers(users.filter(user => !ids.includes(user.id)));
      toast.success(`${ids.length} users deleted successfully`);
    } catch (error) {
      console.error('Failed to delete users:', error);
    }
  };

  return (
    <div>
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

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      ) : (
        <DataTable
          data={users}
          columns={columns}
          searchPlaceholder="Search users..."
          onView={(user) => navigate(`/admin/users/${user.id}`)}
          onEdit={(user) => navigate(`/admin/users/${user.id}/edit`)}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />
      )}
    </div>
  );
}
