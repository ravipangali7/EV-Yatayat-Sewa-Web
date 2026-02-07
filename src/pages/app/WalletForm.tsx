import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { walletApi } from '@/modules/wallets/services/walletApi';
import { userApi } from '@/modules/users/services/userApi';
import { toast } from 'sonner';

export default function WalletForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    user: '',
    balance: 0,
    to_be_pay: 0,
    to_be_received: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userApi.list({ per_page: 1000 });
        setUsers(response.results.map(u => ({ id: u.id, name: u.name || u.username })));
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const wallet = await walletApi.get(id);
          setFormData({
            user: wallet.user || '',
            balance: wallet.balance || 0,
            to_be_pay: wallet.to_be_pay || 0,
            to_be_received: wallet.to_be_received || 0,
          });
        } catch (error) {
          toast.error('Failed to load wallet');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchWallet();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && id) {
        await walletApi.edit(id, formData);
        toast.success('Wallet updated successfully');
      } else {
        await walletApi.create(formData);
        toast.success('Wallet created successfully');
      }
      navigate('/app/wallets');
    } catch (error) {
      console.error(error);
      // Error is already handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  const userOptions = users.map((u) => ({ value: u.id, label: u.name }));

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Wallet' : 'Add Wallet'}
        subtitle={isEdit ? 'Update wallet information' : 'Create a new wallet'}
        backUrl="/app/wallets"
      />

      <form onSubmit={handleSubmit} className="form-section max-w-xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>User</Label>
            <SearchableSelect
              options={userOptions}
              value={formData.user}
              onChange={(value) => setFormData({ ...formData, user: value })}
              placeholder="Select user..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to_be_pay">To Be Paid</Label>
            <Input
              id="to_be_pay"
              type="number"
              step="0.01"
              value={formData.to_be_pay}
              onChange={(e) => setFormData({ ...formData, to_be_pay: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to_be_received">To Be Received</Label>
            <Input
              id="to_be_received"
              type="number"
              step="0.01"
              value={formData.to_be_received}
              onChange={(e) => setFormData({ ...formData, to_be_received: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button type="submit" disabled={loading}>{isEdit ? 'Update' : 'Create'} Wallet</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/wallets')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
