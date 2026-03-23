import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { Switch } from '@/components/ui/switch';
import { blogApi } from '@/modules/website/services/websiteApi';
import { toast } from 'sonner';
import { fileToDataUrl } from '@/lib/imagePreview';
import { API_ORIGIN } from '@/lib/api';

function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [meta_title, setMetaTitle] = useState('');
  const [meta_description, setMetaDescription] = useState('');
  const [og_image_alt, setOgImageAlt] = useState('');
  const [canonical_path, setCanonicalPath] = useState('');
  const [robots_noindex, setRobotsNoindex] = useState(false);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      setLoading(true);
      try {
        const d = await blogApi.get(id);
        setName(d.name || '');
        setSlug(d.slug || '');
        setContent(d.content || '');
        setExcerpt(d.excerpt || '');
        setCategory(d.category || '');
        setIsActive(d.is_active ?? true);
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
      fd.append('name', name);
      fd.append('slug', slug);
      fd.append('content', content);
      fd.append('excerpt', excerpt);
      fd.append('category', category);
      fd.append('is_active', String(is_active));
      fd.append('meta_title', meta_title);
      fd.append('meta_description', meta_description);
      fd.append('og_image_alt', og_image_alt);
      fd.append('canonical_path', canonical_path);
      fd.append('robots_noindex', String(robots_noindex));
      if (imageFile) fd.append('image', imageFile);
      if (ogImageFile) fd.append('og_image', ogImageFile);
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
          <Label>Excerpt</Label>
          <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary for cards and social" />
        </div>
        <div>
          <Label>Category</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. News, Travel" />
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
          <Input value={meta_title} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Defaults to post title" />
        </div>
        <div>
          <Label>Meta description override</Label>
          <Textarea value={meta_description} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Defaults to excerpt or content" rows={2} />
        </div>
        <div>
          <Label>OG image alt text</Label>
          <Input value={og_image_alt} onChange={(e) => setOgImageAlt(e.target.value)} />
        </div>
        <div>
          <Label>Canonical path override</Label>
          <Input value={canonical_path} onChange={(e) => setCanonicalPath(e.target.value)} placeholder="/blog/my-slug/" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={robots_noindex} onCheckedChange={setRobotsNoindex} />
          <Label>Hide from search engines (noindex)</Label>
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
