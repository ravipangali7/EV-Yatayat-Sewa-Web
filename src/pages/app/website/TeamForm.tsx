import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { teamApi } from '@/modules/website/services/websiteApi';
import { toast } from 'sonner';

const API_BASE = 'https://system.evyatayatsewa.com';

export default function TeamForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      setLoading(true);
      try {
        const d = await teamApi.get(id);
        setName(d.name || '');
        setDesignation(d.designation || '');
        setPhone(d.phone || '');
        setEmail(d.email || '');
        setAddress(d.address || '');
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
      fd.append('designation', designation);
      fd.append('phone', phone);
      fd.append('email', email);
      fd.append('address', address);
      fd.append('is_active', String(is_active));
      if (imageFile) fd.append('image', imageFile);
      if (isEdit && id) {
        await teamApi.edit(id, fd);
        toast.success('Updated');
      } else {
        await teamApi.create(fd);
        toast.success('Created');
      }
      navigate('/admin/website/team');
    } catch (err) {
      console.error(err);
    }
  };

  if (isEdit && loading) {
    return (
      <div>
        <PageHeader title="Edit Team" backUrl="/admin/website/team" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Team' : 'Add Team'}
        backUrl="/admin/website/team"
      />
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Designation</Label>
          <Input value={designation} onChange={(e) => setDesignation(e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Address</Label>
          <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
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
          <Button type="button" variant="outline" onClick={() => navigate('/admin/website/team')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
