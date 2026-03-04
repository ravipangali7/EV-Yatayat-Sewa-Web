import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { contactMessageApi } from '@/modules/website/services/websiteApi';
import { toast } from 'sonner';

export default function ContactMessageEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [is_read, setIsRead] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const d = await contactMessageApi.get(id);
        setIsRead(d.is_read ?? false);
      } catch (e) {
        toast.error('Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await contactMessageApi.edit(id, { is_read: is_read });
      toast.success('Updated');
      navigate('/admin/website/contact-messages');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Contact Message" backUrl="/admin/website/contact-messages" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit Contact Message" backUrl="/admin/website/contact-messages" />
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div className="flex items-center gap-2">
          <Switch checked={is_read} onCheckedChange={setIsRead} />
          <Label>Mark as read</Label>
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/website/contact-messages')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
