import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { cmsPageApi } from '@/modules/website/services/websiteApi';
import { toast } from 'sonner';

const API_BASE = 'https://system.evyatayatsewa.com';

export default function CmsPageForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [is_footer, setIsFooter] = useState(false);
  const [is_header, setIsHeader] = useState(false);
  const [is_about, setIsAbout] = useState(false);
  const [section_in, setSectionIn] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sectionOptions, setSectionOptions] = useState<{ id: number; title: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await cmsPageApi.list({ per_page: 500 });
        setSectionOptions(res.results.map((r) => ({ id: r.id, title: r.title })));
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      setLoading(true);
      try {
        const d = await cmsPageApi.get(id);
        setTitle(d.title || '');
        setSlug(d.slug || '');
        setContent(d.content || '');
        setIsActive(d.is_active ?? true);
        setIsFooter(d.is_footer ?? false);
        setIsHeader(d.is_header ?? false);
        setIsAbout(d.is_about ?? false);
        setSectionIn(d.section_in != null ? String(d.section_in) : '');
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
      fd.append('slug', slug);
      fd.append('content', content);
      fd.append('is_active', String(is_active));
      fd.append('is_footer', String(is_footer));
      fd.append('is_header', String(is_header));
      fd.append('is_about', String(is_about));
      if (section_in) fd.append('section_in', section_in);
      else fd.append('section_in', '');
      if (imageFile) fd.append('image', imageFile);
      if (isEdit && id) {
        await cmsPageApi.edit(id, fd);
        toast.success('Updated');
      } else {
        await cmsPageApi.create(fd);
        toast.success('Created');
      }
      navigate('/admin/website/cms-pages');
    } catch (err) {
      console.error(err);
    }
  };

  if (isEdit && loading) {
    return (
      <div>
        <PageHeader title="Edit CMS Page" backUrl="/admin/website/cms-pages" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit CMS Page' : 'Add CMS Page'}
        backUrl="/admin/website/cms-pages"
      />
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
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
        <div>
          <Label>Section In (parent page)</Label>
          <select
            className="w-full border rounded px-3 py-2 bg-background"
            value={section_in}
            onChange={(e) => setSectionIn(e.target.value)}
          >
            <option value="">None</option>
            {sectionOptions.filter((o) => String(o.id) !== id).map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={is_active} onCheckedChange={setIsActive} />
            <Label>Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={is_header} onCheckedChange={setIsHeader} />
            <Label>Header</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={is_footer} onCheckedChange={setIsFooter} />
            <Label>Footer</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={is_about} onCheckedChange={setIsAbout} />
            <Label>About</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/website/cms-pages')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
