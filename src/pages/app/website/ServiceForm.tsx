import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { serviceApi } from '@/modules/website/services/websiteApi';
import { toast } from 'sonner';

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [svg, setSvg] = useState('');
  const [description, setDescription] = useState('');
  const [is_active, setIsActive] = useState(true);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      setLoading(true);
      try {
        const d = await serviceApi.get(id);
        setName(d.name || '');
        setSlug(d.slug || '');
        setSvg(d.svg || '');
        setDescription(d.description || '');
        setIsActive(d.is_active ?? true);
      } catch (e) {
        toast.error('Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name, slug, svg, description, is_active };
      if (isEdit && id) {
        await serviceApi.edit(id, payload);
        toast.success('Updated');
      } else {
        await serviceApi.create(payload);
        toast.success('Created');
      }
      navigate('/admin/website/services');
    } catch (err) {
      console.error(err);
    }
  };

  if (isEdit && loading) {
    return (
      <div>
        <PageHeader title="Edit Service" backUrl="/admin/website/services" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Service' : 'Add Service'}
        backUrl="/admin/website/services"
      />
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
        <div>
          <Label>SVG (markup)</Label>
          <Textarea value={svg} onChange={(e) => setSvg(e.target.value)} rows={4} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={is_active} onCheckedChange={setIsActive} />
          <Label>Active</Label>
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/website/services')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
