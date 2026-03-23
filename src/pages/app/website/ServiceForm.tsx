import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconPicker } from '@/components/common/IconPicker';
import { suggestIconFromText } from '@/lib/websiteIcons';
import { Switch } from '@/components/ui/switch';
import { serviceApi } from '@/modules/website/services/websiteApi';
import { toast } from 'sonner';
import { fileToDataUrl } from '@/lib/imagePreview';
import { API_ORIGIN } from '@/lib/api';

function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [svg, setSvg] = useState('');
  const [icon, setIcon] = useState('');
  const [order, setOrder] = useState(0);
  const [description, setDescription] = useState('');
  const [is_active, setIsActive] = useState(true);
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
        const d = await serviceApi.get(id);
        setName(d.name || '');
        setSlug(d.slug || '');
        setSvg(d.svg || '');
        setIcon(d.icon || '');
        setOrder(d.order ?? 0);
        setDescription(d.description || '');
        setIsActive(d.is_active ?? true);
        setMetaTitle(d.meta_title || '');
        setMetaDescription(d.meta_description || '');
        setOgImageAlt(d.og_image_alt || '');
        setCanonicalPath(d.canonical_path || '');
        setRobotsNoindex(d.robots_noindex ?? false);
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
      fd.append('svg', svg);
      fd.append('icon', icon);
      fd.append('order', String(order));
      fd.append('description', description);
      fd.append('is_active', String(is_active));
      fd.append('meta_title', meta_title);
      fd.append('meta_description', meta_description);
      fd.append('og_image_alt', og_image_alt);
      fd.append('canonical_path', canonical_path);
      fd.append('robots_noindex', String(robots_noindex));
      if (ogImageFile) fd.append('og_image', ogImageFile);
      if (isEdit && id) {
        await serviceApi.edit(id, fd);
        toast.success('Updated');
      } else {
        await serviceApi.create(fd);
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
          <Label>Order</Label>
          <Input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div>
          <Label>Website icon (SVG markup)</Label>
          <IconPicker
            value={svg}
            onChange={setSvg}
            placeholder="Select icon..."
            suggestedIcon={suggestIconFromText(name)}
            onApplySuggestion={() => {
              const ic = suggestIconFromText(name);
              if (ic) setSvg(ic);
            }}
          />
        </div>
        <div>
          <Label>Lucide icon name (optional)</Label>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. Bus" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label>OG image (optional)</Label>
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
          <Input value={canonical_path} onChange={(e) => setCanonicalPath(e.target.value)} placeholder="/service/slug/" />
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
          <Button type="button" variant="outline" onClick={() => navigate('/admin/website/services')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
