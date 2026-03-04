import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { cmsPageApi } from '@/modules/website/services/websiteApi';
import type { CMSPage } from '@/modules/website/types';
import { toast } from 'sonner';

export default function CmsPages() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await cmsPageApi.list({ per_page: 1000 });
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

  const columns: Column<CMSPage & { id: string }>[] = [
    { key: 'title', header: 'Title' },
    { key: 'slug', header: 'Slug' },
    {
      key: 'flags',
      header: 'Flags',
      render: (row) =>
        [row.is_about && 'About', row.is_header && 'Header', row.is_footer && 'Footer']
          .filter(Boolean)
          .join(', ') || '-',
    },
    { key: 'is_active', header: 'Active', render: (row) => (row.is_active ? 'Yes' : 'No') },
  ];

  const handleDelete = async (id: string) => {
    try {
      await cmsPageApi.delete(id);
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
        title="CMS Pages"
        subtitle="Content pages"
        actions={
          <Button onClick={() => navigate('/admin/website/cms-pages/add')}>
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
          onView={(row) => navigate(`/admin/website/cms-pages/${row.id}`)}
          onEdit={(row) => navigate(`/admin/website/cms-pages/${row.id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
