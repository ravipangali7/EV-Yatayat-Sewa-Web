import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { Switch } from '@/components/ui/switch';
import { blogApi } from '@/modules/website/services/websiteApi';
import { toast } from 'sonner';

const API_BASE = 'https://system.evyatayatsewa.com';

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      setLoading(true);
      try {
        const d = await blogApi.get(id);
        setName(d.name || '');
        setSlug(d.slug || '');
        setContent(d.content || '');
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
      fd.append('name', name);
      fd.append('slug', slug);
      fd.append('content', content);
      fd.append('is_active', String(is_active));
      if (imageFile) fd.append('image', imageFile);
      if (isEdit && id) {
        await blogApi.edit(id, fd);
        toast.success('Updated');
      } else {
        await blogApi.create(fd);
        toast.success('Created');
      }
      navigate('/admin/website/blogs');
    } catch (err) {
      console.error(err);
    }
  };

  if (isEdit && loading) {
    return (
      <div>
        <PageHeader title="Edit Blog" backUrl="/admin/website/blogs" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Blog' : 'Add Blog'}
        backUrl="/admin/website/blogs"
      />
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
        <div>
          <Label>Title</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
        <div>
          <Label>Content</Label>
          <RichTextEditor value={content} onChange={setContent} />
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
          <Button type="button" variant="outline" onClick={() => navigate('/admin/website/blogs')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
