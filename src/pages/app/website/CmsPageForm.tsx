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
import { fileToDataUrl } from '@/lib/imagePreview';
import { API_ORIGIN } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';

function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

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
  const [meta_title, setMetaTitle] = useState('');
  const [meta_description, setMetaDescription] = useState('');
  const [og_image_alt, setOgImageAlt] = useState('');
  const [canonical_path, setCanonicalPath] = useState('');
  const [robots_noindex, setRobotsNoindex] = useState(false);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
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
        setMetaTitle(d.meta_title || '');
        setMetaDescription(d.meta_description || '');
        setOgImageAlt(d.og_image_alt || '');
        setCanonicalPath(d.canonical_path || '');
        setRobotsNoindex(d.robots_noindex ?? false);
        const img = mediaUrl(d.image);
        if (img) setImagePreview(img);
        const og = mediaUrl(d.og_image);
        if (og) setOgImagePreview(og);
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
      fd.append('meta_title', meta_title);
      fd.append('meta_description', meta_description);
      fd.append('og_image_alt', og_image_alt);
      fd.append('canonical_path', canonical_path);
      fd.append('robots_noindex', String(robots_noindex));
      if (imageFile) fd.append('image', imageFile);
      if (ogImageFile) fd.append('og_image', ogImageFile);
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
              if (f) fileToDataUrl(f).then(setImagePreview);
              else setImagePreview(null);
            }}
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="mt-2 h-24 object-cover rounded" />
          )}
        </div>
        <div>
          <Label>OG image (optional override)</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setOgImageFile(f || null);
              if (f) fileToDataUrl(f).then(setOgImagePreview);
              else setOgImagePreview(null);
            }}
          />
          {ogImagePreview && (
            <img src={ogImagePreview} alt="OG preview" className="mt-2 h-24 object-cover rounded" />
          )}
        </div>
        <h3 className="text-lg font-semibold pt-2">SEO</h3>
        <div>
          <Label>Meta title override</Label>
          <Input value={meta_title} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>
        <div>
          <Label>Meta description override</Label>
          <Textarea value={meta_description} onChange={(e) => setMetaDescription(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>OG image alt text</Label>
          <Input value={og_image_alt} onChange={(e) => setOgImageAlt(e.target.value)} />
        </div>
        <div>
          <Label>Canonical path override</Label>
          <Input value={canonical_path} onChange={(e) => setCanonicalPath(e.target.value)} placeholder="/page/slug/" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={robots_noindex} onCheckedChange={setRobotsNoindex} />
          <Label>Hide from search engines (noindex)</Label>
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
