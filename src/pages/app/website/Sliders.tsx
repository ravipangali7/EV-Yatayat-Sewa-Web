import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { sliderApi } from '@/modules/website/services/websiteApi';
import type { Slider } from '@/modules/website/types';
import { toast } from 'sonner';

export default function Sliders() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await sliderApi.list({ per_page: 1000 });
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

  const columns: Column<Slider & { id: string }>[] = [
    { key: 'title', header: 'Title' },
    { key: 'subtitle', header: 'Subtitle' },
    {
      key: 'is_active',
      header: 'Active',
      render: (row) => (row.is_active ? 'Yes' : 'No'),
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await sliderApi.delete(id);
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
        title="Sliders"
        subtitle="Home page sliders"
        actions={
          <Button onClick={() => navigate('/admin/website/sliders/add')}>
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
          onView={(row) => navigate(`/admin/website/sliders/${row.id}`)}
          onEdit={(row) => navigate(`/admin/website/sliders/${row.id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
