import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { OrderableTable, Column } from '@/components/common/OrderableTable';
import { teamApi } from '@/modules/website/services/websiteApi';
import type { Team } from '@/modules/website/types';
import { toast } from 'sonner';

export default function TeamList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await teamApi.list({ per_page: 1000 });
      setItems(res.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const columns: Column<Team>[] = [
    { key: 'name', header: 'Name' },
    { key: 'designation', header: 'Designation' },
    { key: 'email', header: 'Email' },
  ];

  const handleReorder = async (newItems: Team[]) => {
    try {
      await teamApi.reorder(newItems.map((it, idx) => ({ id: it.id, order: idx })));
      setItems(newItems);
      toast.success('Order updated');
    } catch (e) {
      toast.error('Failed to update order');
      fetchList();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await teamApi.delete(id);
      setItems((prev) => prev.filter((s) => String(s.id) !== id));
      toast.success('Deleted');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Drag to reorder"
        actions={
          <Button onClick={() => navigate('/admin/website/team/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
      />
      <OrderableTable
        data={items}
        columns={columns}
        onReorder={handleReorder}
        onView={(row) => navigate(`/admin/website/team/${row.id}`)}
        onEdit={(row) => navigate(`/admin/website/team/${row.id}/edit`)}
        onDelete={handleDelete}
        loading={loading}
      />
    </div>
  );
}
