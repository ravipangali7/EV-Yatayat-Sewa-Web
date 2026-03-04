import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { contactMessageApi } from '@/modules/website/services/websiteApi';
import { toast } from 'sonner';

export default function ContactMessageView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ name: string; phone: string; message: string; is_read: boolean; created_at: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const d = await contactMessageApi.get(id);
        setData({
          name: d.name || '',
          phone: d.phone || '',
          message: d.message || '',
          is_read: d.is_read ?? false,
          created_at: d.created_at || '',
        });
        if (!d.is_read) {
          await contactMessageApi.edit(id, { is_read: true });
        }
      } catch (e) {
        toast.error('Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Contact Message" backUrl="/admin/website/contact-messages" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Contact Message"
        backUrl="/admin/website/contact-messages"
        actions={
          <Button variant="outline" onClick={() => navigate(`/admin/website/contact-messages/${id}/edit`)}>
            Edit
          </Button>
        }
      />
      <div className="max-w-xl space-y-2">
        <p><strong>Name:</strong> {data.name}</p>
        <p><strong>Phone:</strong> {data.phone}</p>
        <p><strong>Date:</strong> {data.created_at ? new Date(data.created_at).toLocaleString() : ''}</p>
        <p><strong>Read:</strong> {data.is_read ? 'Yes' : 'No'}</p>
        <div>
          <strong>Message:</strong>
          <p className="mt-1 whitespace-pre-wrap rounded border p-3 bg-muted/30">{data.message}</p>
        </div>
      </div>
    </div>
  );
}
