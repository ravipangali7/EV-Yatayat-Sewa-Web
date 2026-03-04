import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { testimonialApi } from '@/modules/website/services/websiteApi';
import type { Testimonial } from '@/modules/website/types';
import { toast } from 'sonner';

export default function Testimonials() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await testimonialApi.list({ per_page: 1000 });
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

  const columns: Column<Testimonial & { id: string }>[] = [
    { key: 'name', header: 'Name' },
    { key: 'star', header: 'Stars' },
    {
      key: 'message',
      header: 'Message',
      render: (row) => <span className="line-clamp-1 max-w-xs">{row.message}</span>,
    },
    { key: 'is_active', header: 'Active', render: (row) => (row.is_active ? 'Yes' : 'No') },
  ];

  const handleDelete = async (id: string) => {
    try {
      await testimonialApi.delete(id);
      setItems((prev) => prev.filter((s) => String(s.id) !== id));
      toast.success('Deleted');
    } catch (e) {
      console.error(e);
    }
  };

  const dataWithStringId = items.map((s) => ({ ...s, id: String(s.id) }));

  return (
    <div>
      <PageHeader
        title="Testimonials"
        subtitle="Customer testimonials"
        actions={
          <Button onClick={() => navigate('/admin/website/testimonials/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
      />
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          data={dataWithStringId}
          columns={columns}
          onView={(row) => navigate(`/admin/website/testimonials/${row.id}`)}
          onEdit={(row) => navigate(`/admin/website/testimonials/${row.id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
