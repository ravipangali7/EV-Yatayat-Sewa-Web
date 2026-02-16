import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { cardApi, CardWithUserDetails } from '@/modules/cards/services/cardApi';
import { userApi } from '@/modules/users/services/userApi';
import { toast } from 'sonner';

export default function CardForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [users, setUsers] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [formData, setFormData] = useState({ user: '', card_number: '', balance: '0', is_active: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userApi.list({ per_page: 500 }).then((res) => {
      setUsers(res.results.map((u) => ({ id: u.id, name: u.name || u.phone || u.id, phone: u.phone })));
    }).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      cardApi.get(id).then((card: CardWithUserDetails) => {
        setFormData({
          user: card.user || '',
          card_number: card.card_number || '',
          balance: String(card.balance ?? 0),
          is_active: card.is_active ?? true,
        });
      }).catch(() => toast.error('Failed to load card')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.card_number.trim()) { toast.error('Card number is required'); return; }
    setLoading(true);
    try {
      if (isEdit && id) {
        await cardApi.update(id, { user: formData.user || undefined, card_number: formData.card_number.trim(), balance: formData.balance, is_active: formData.is_active });
        toast.success('Card updated');
      } else {
        await cardApi.create({ user: formData.user || undefined, card_number: formData.card_number.trim(), balance: formData.balance, is_active: formData.is_active });
        toast.success('Card created');
      }
      navigate('/admin/cards');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const userOptions = users.map((u) => ({ value: u.id, label: `${u.name} (${u.phone})` }));

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Card' : 'Add Card'} backUrl="/admin/cards" />
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div className="space-y-2">
          <Label>User (optional)</Label>
          <SearchableSelect options={[{ value: '', label: '— No user —' }, ...userOptions]} value={formData.user} onChange={(v) => setFormData((p) => ({ ...p, user: v }))} placeholder="Select user..." />
        </div>
        <div className="space-y-2">
          <Label>Card Number *</Label>
          <Input value={formData.card_number} onChange={(e) => setFormData((p) => ({ ...p, card_number: e.target.value }))} placeholder="Card number" required />
        </div>
        <div className="space-y-2">
          <Label>Balance</Label>
          <Input type="number" step="0.01" value={formData.balance} onChange={(e) => setFormData((p) => ({ ...p, balance: e.target.value }))} placeholder="0" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: v }))} />
          <Label>Active</Label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/cards')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
