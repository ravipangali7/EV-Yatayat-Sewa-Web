import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { contactMessageApi } from '@/modules/website/services/websiteApi';
import type { ContactMessage } from '@/modules/website/types';
import { toast } from 'sonner';

export default function ContactMessages() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await contactMessageApi.list({ per_page: 1000 });
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

  const columns: Column<ContactMessage & { id: string }>[] = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'message',
      header: 'Message',
      render: (row) => <span className="line-clamp-1 max-w-xs">{row.message}</span>,
    },
    { key: 'is_read', header: 'Read', render: (row) => (row.is_read ? 'Yes' : 'No') },
    {
      key: 'created_at',
      header: 'Date',
      render: (row) => (row.created_at ? new Date(row.created_at).toLocaleDateString() : ''),
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await contactMessageApi.delete(id);
      setItems((prev) => prev.filter((s) => String(s.id) !== id));
      toast.success('Deleted');
    } catch (e) {
      console.error(e);
    }
  };

  const dataWithStringId = items.map((s) => ({ ...s, id: String(s.id) }));

  return (
    <div>
      <PageHeader title="Contact Messages" subtitle="Incoming contact form submissions" />
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          data={dataWithStringId}
          columns={columns}
          onView={(row) => navigate(`/admin/website/contact-messages/${row.id}`)}
          onEdit={(row) => navigate(`/admin/website/contact-messages/${row.id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
