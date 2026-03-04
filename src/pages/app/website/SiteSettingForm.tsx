import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { siteSettingApi } from '@/modules/website/services/websiteApi';
import type { SiteSetting, StatItem } from '@/modules/website/types';
import { toast } from 'sonner';
import { fileToDataUrl } from '@/lib/imagePreview';

const API_BASE = 'https://system.evyatayatsewa.com';

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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

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
        if (d.logo) {
          const url = d.logo.startsWith('http') ? d.logo : `${API_BASE}${d.logo.startsWith('/') ? '' : '/'}${d.logo}`;
          setLogoPreview(url);
        }
        if (d.cover_image) {
          const url = d.cover_image.startsWith('http') ? d.cover_image : `${API_BASE}${d.cover_image.startsWith('/') ? '' : '/'}${d.cover_image}`;
          setCoverPreview(url);
        }
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
      if (logoFile) fd.append('logo', logoFile);
      if (coverFile) fd.append('cover_image', coverFile);
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
              <Textarea placeholder="SVG markup" value={s.svg} onChange={(e) => setStatAt(i, 'svg', e.target.value)} rows={2} />
              <Input placeholder="Value" value={s.value} onChange={(e) => setStatAt(i, 'value', e.target.value)} />
              <Button type="button" variant="outline" size="sm" onClick={() => removeStat(i)}>Remove</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addStat}>+ Stat</Button>
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/website/sliders')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
