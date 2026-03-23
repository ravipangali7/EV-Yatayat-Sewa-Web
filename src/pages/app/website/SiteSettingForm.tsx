import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { IconPicker } from '@/components/common/IconPicker';
import { suggestIconFromText } from '@/lib/websiteIcons';
import { siteSettingApi } from '@/modules/website/services/websiteApi';
import type { StatItem } from '@/modules/website/types';
import { toast } from 'sonner';
import { fileToDataUrl } from '@/lib/imagePreview';
import { API_ORIGIN } from '@/lib/api';

function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function SiteSettingForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phones, setPhones] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [map, setMap] = useState('');
  const [footer_text, setFooterText] = useState('');
  const [stats, setStats] = useState<StatItem[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [defaultOgFile, setDefaultOgFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [defaultOgPreview, setDefaultOgPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [meta_title, setMetaTitle] = useState('');
  const [meta_description, setMetaDescription] = useState('');
  const [twitter_handle, setTwitterHandle] = useState('');
  const [facebook_app_id, setFacebookAppId] = useState('');
  const [og_locale, setOgLocale] = useState('en_US');
  const [google_site_verification, setGoogleSiteVerification] = useState('');
  const [about_title, setAboutTitle] = useState('');
  const [about_content, setAboutContent] = useState('');
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [values, setValues] = useState('');
  const [aboutFile, setAboutFile] = useState<File | null>(null);
  const [aboutPreview, setAboutPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await siteSettingApi.get();
        setName(d.name || '');
        setTagline(d.tagline || '');
        setPhones(Array.isArray(d.phones) ? d.phones : []);
        setEmails(Array.isArray(d.emails) ? d.emails : []);
        setAddress(d.address || '');
        setMap(d.map || '');
        setFooterText(d.footer_text || '');
        setStats(d.stats?.stats && Array.isArray(d.stats.stats) ? d.stats.stats : []);
        setMetaTitle(d.meta_title || '');
        setMetaDescription(d.meta_description || '');
        setTwitterHandle(d.twitter_handle || '');
        setFacebookAppId(d.facebook_app_id || '');
        setOgLocale(d.og_locale || 'en_US');
        setGoogleSiteVerification(d.google_site_verification || '');
        const logoU = mediaUrl(d.logo);
        if (logoU) setLogoPreview(logoU);
        const favU = mediaUrl(d.favicon);
        if (favU) setFaviconPreview(favU);
        const defOg = mediaUrl(d.default_og_image);
        if (defOg) setDefaultOgPreview(defOg);
        const coverU = mediaUrl(d.cover_image);
        if (coverU) setCoverPreview(coverU);
        setAboutTitle(d.about_title ?? '');
        setAboutContent(d.about_content ?? '');
        setMission(d.mission ?? '');
        setVision(d.vision ?? '');
        setValues(typeof d.values === 'string' ? d.values : (Array.isArray(d.values) ? (d.values as { text?: string }[]).map((v) => v?.text ?? '').filter(Boolean).join('\n') : ''));
        const aboutU = mediaUrl(d.about_image);
        if (aboutU) setAboutPreview(aboutU);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('tagline', tagline);
      fd.append('phones', JSON.stringify(phones));
      fd.append('emails', JSON.stringify(emails));
      fd.append('address', address);
      fd.append('map', map);
      fd.append('footer_text', footer_text);
      fd.append('stats', JSON.stringify({ stats }));
      fd.append('about_title', about_title);
      fd.append('about_content', about_content);
      fd.append('mission', mission);
      fd.append('vision', vision);
      fd.append('values', values);
      fd.append('meta_title', meta_title);
      fd.append('meta_description', meta_description);
      fd.append('twitter_handle', twitter_handle);
      fd.append('facebook_app_id', facebook_app_id);
      fd.append('og_locale', og_locale);
      fd.append('google_site_verification', google_site_verification);
      if (logoFile) fd.append('logo', logoFile);
      if (faviconFile) fd.append('favicon', faviconFile);
      if (defaultOgFile) fd.append('default_og_image', defaultOgFile);
      if (coverFile) fd.append('cover_image', coverFile);
      if (aboutFile) fd.append('about_image', aboutFile);
      await siteSettingApi.edit(fd);
      toast.success('Saved');
      navigate('/admin/website/site-setting');
    } catch (err) {
      console.error(err);
    }
  };

  const addPhone = () => setPhones((p) => [...p, '']);
  const setPhoneAt = (i: number, v: string) => setPhones((p) => {
    const n = [...p];
    n[i] = v;
    return n;
  });
  const removePhone = (i: number) => setPhones((p) => p.filter((_, j) => j !== i));

  const addEmail = () => setEmails((e) => [...e, '']);
  const setEmailAt = (i: number, v: string) => setEmails((e) => {
    const n = [...e];
    n[i] = v;
    return n;
  });
  const removeEmail = (i: number) => setEmails((e) => e.filter((_, j) => j !== i));

  const addStat = () => setStats((s) => [...s, { label: '', svg: '', value: '' }]);
  const setStatAt = (i: number, field: keyof StatItem, v: string) => setStats((s) => {
    const n = [...s];
    n[i] = { ...n[i], [field]: v };
    return n;
  });
  const removeStat = (i: number) => setStats((s) => s.filter((_, j) => j !== i));

  if (loading) {
    return (
      <div>
        <PageHeader title="Site Setting" backUrl="/admin/website/sliders" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Site Setting" subtitle="Single site configuration" backUrl="/admin/website/sliders" />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <Label>Site Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Tagline</Label>
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
        <div>
          <Label>Logo</Label>
          <Input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            setLogoFile(f || null);
            if (f) fileToDataUrl(f).then(setLogoPreview);
            else setLogoPreview(null);
          }} />
          {logoPreview && <img src={logoPreview} alt="Logo" className="mt-2 h-16 object-contain" />}
        </div>
        <div>
          <Label>Cover Image</Label>
          <Input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            setCoverFile(f || null);
            if (f) fileToDataUrl(f).then(setCoverPreview);
            else setCoverPreview(null);
          }} />
          {coverPreview && <img src={coverPreview} alt="Cover" className="mt-2 h-24 object-cover rounded" />}
        </div>
        <div>
          <Label>Favicon</Label>
          <Input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            setFaviconFile(f || null);
            if (f) fileToDataUrl(f).then(setFaviconPreview);
            else setFaviconPreview(null);
          }} />
          {faviconPreview && <img src={faviconPreview} alt="Favicon" className="mt-2 h-10 object-contain" />}
        </div>
        <div>
          <Label>Default Open Graph image</Label>
          <Input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            setDefaultOgFile(f || null);
            if (f) fileToDataUrl(f).then(setDefaultOgPreview);
            else setDefaultOgPreview(null);
          }} />
          {defaultOgPreview && <img src={defaultOgPreview} alt="Default OG" className="mt-2 h-24 object-cover rounded" />}
        </div>
        <h3 className="text-lg font-semibold">SEO &amp; social</h3>
        <div>
          <Label>Default meta title</Label>
          <Input value={meta_title} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Site-wide default document title" />
        </div>
        <div>
          <Label>Default meta description</Label>
          <Textarea value={meta_description} onChange={(e) => setMetaDescription(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>Twitter / X handle (no @)</Label>
          <Input value={twitter_handle} onChange={(e) => setTwitterHandle(e.target.value)} placeholder="yourbrand" />
        </div>
        <div>
          <Label>Facebook app ID (optional)</Label>
          <Input value={facebook_app_id} onChange={(e) => setFacebookAppId(e.target.value)} />
        </div>
        <div>
          <Label>OG locale</Label>
          <Input value={og_locale} onChange={(e) => setOgLocale(e.target.value)} placeholder="en_US" />
        </div>
        <div>
          <Label>Google site verification (content token only)</Label>
          <Input value={google_site_verification} onChange={(e) => setGoogleSiteVerification(e.target.value)} />
        </div>
        <div>
          <Label>Phones</Label>
          {phones.map((p, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input value={p} onChange={(e) => setPhoneAt(i, e.target.value)} placeholder="+977..." />
              <Button type="button" variant="outline" size="sm" onClick={() => removePhone(i)}>Remove</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addPhone}>+ Phone</Button>
        </div>
        <div>
          <Label>Emails</Label>
          {emails.map((e, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input value={e} onChange={(ev) => setEmailAt(i, ev.target.value)} placeholder="email@example.com" />
              <Button type="button" variant="outline" size="sm" onClick={() => removeEmail(i)}>Remove</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addEmail}>+ Email</Button>
        </div>
        <div>
          <Label>Address</Label>
          <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <Label>Map (URL or embed)</Label>
          <Textarea value={map} onChange={(e) => setMap(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>Footer Text</Label>
          <Textarea value={footer_text} onChange={(e) => setFooterText(e.target.value)} />
        </div>
        <div>
          <Label>Stats</Label>
          {stats.map((s, i) => (
            <div key={i} className="border rounded p-3 mb-2 space-y-2">
              <Input placeholder="Label" value={s.label} onChange={(e) => setStatAt(i, 'label', e.target.value)} />
              <div>
                <Label className="text-muted-foreground text-xs">Icon</Label>
                <IconPicker
                  value={s.svg}
                  onChange={(v) => setStatAt(i, 'svg', v)}
                  placeholder="Select icon..."
                  suggestedIcon={suggestIconFromText(s.label)}
                  onApplySuggestion={() => {
                    const icon = suggestIconFromText(s.label);
                    if (icon) setStatAt(i, 'svg', icon);
                  }}
                />
              </div>
              <Input placeholder="Value" value={s.value} onChange={(e) => setStatAt(i, 'value', e.target.value)} />
              <Button type="button" variant="outline" size="sm" onClick={() => removeStat(i)}>Remove</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addStat}>+ Stat</Button>
        </div>
        <hr className="my-6" />
        <h3 className="text-lg font-semibold">About (home page)</h3>
        <div>
          <Label>About Image</Label>
          <Input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            setAboutFile(f || null);
            if (f) fileToDataUrl(f).then(setAboutPreview);
            else setAboutPreview(null);
          }} />
          {aboutPreview && <img src={aboutPreview} alt="About" className="mt-2 h-24 object-cover rounded" />}
        </div>
        <div>
          <Label>About Title</Label>
          <Input value={about_title} onChange={(e) => setAboutTitle(e.target.value)} placeholder="e.g. Driving Nepal Towards a Greener Future" />
        </div>
        <div>
          <Label>About Content</Label>
          <RichTextEditor value={about_content} onChange={setAboutContent} placeholder="About section content (bold, lists, headings…)" minHeight="180px" />
        </div>
        <div>
          <Label>Mission</Label>
          <Textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>Vision</Label>
          <Textarea value={vision} onChange={(e) => setVision(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>Values</Label>
          <Textarea value={values} onChange={(e) => setValues(e.target.value)} rows={3} placeholder="Our values (plain text, shown like Mission and Vision)" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/website/sliders')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
