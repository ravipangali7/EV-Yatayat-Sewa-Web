import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { getWallet, getUsers, createWallet, updateWallet } from '@/stores/mockData';
import { toast } from 'sonner';

export default function WalletForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const users = getUsers();

  const [formData, setFormData] = useState({
    user: '',
    balance: 0,
    to_be_pay: 0,
    to_be_received: 0,
  });

  useEffect(() => {
    if (isEdit && id) {
      const wallet = getWallet(id);
      if (wallet) {
        setFormData({
          user: wallet.user,
          balance: wallet.balance,
          to_be_pay: wallet.to_be_pay,
          to_be_received: wallet.to_be_received,
        });
      }
    }
  }, [id, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && id) {
      updateWallet(id, formData);
      toast.success('Wallet updated successfully');
    } else {
      createWallet(formData);
      toast.success('Wallet created successfully');
    }
    navigate('/app/wallets');
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
          <Button type="submit">{isEdit ? 'Update' : 'Create'} Wallet</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/wallets')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
