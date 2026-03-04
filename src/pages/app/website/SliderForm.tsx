import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { sliderApi } from '@/modules/website/services/websiteApi';
import { toast } from 'sonner';

const API_BASE = 'https://system.evyatayatsewa.com';

export default function SliderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      setLoading(true);
      try {
        const d = await sliderApi.get(id);
        setTitle(d.title || '');
        setSubtitle(d.subtitle || '');
        setIsActive(d.is_active ?? true);
        if (d.image) {
          const url = d.image.startsWith('http') ? d.image : `${API_BASE}${d.image.startsWith('/') ? '' : '/'}${d.image}`;
          setImagePreview(url);
        }
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
      const fd = new FormData();
      fd.append('title', title);
      fd.append('subtitle', subtitle);
      fd.append('is_active', String(is_active));
      if (imageFile) fd.append('image', imageFile);
      if (isEdit && id) {
        await sliderApi.edit(id, fd);
        toast.success('Updated');
      } else {
        await sliderApi.create(fd);
        toast.success('Created');
      }
      navigate('/admin/website/sliders');
    } catch (err) {
      console.error(err);
    }
  };

  if (isEdit && loading) {
    return (
      <div>
        <PageHeader title="Edit Slider" backUrl="/admin/website/sliders" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Slider' : 'Add Slider'}
        backUrl="/admin/website/sliders"
      />
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label>Subtitle</Label>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div>
          <Label>Image</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setImageFile(f || null);
              setImagePreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="mt-2 h-24 object-cover rounded" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={is_active} onCheckedChange={setIsActive} />
          <Label>Active</Label>
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/website/sliders')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
