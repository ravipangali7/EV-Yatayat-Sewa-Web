import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { transactionApi } from '@/modules/transactions/services/transactionApi';
import { walletApi } from '@/modules/wallets/services/walletApi';
import { Transaction, TransactionStatus, TransactionType, Wallet } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function TransactionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [txDetails, setTxDetails] = useState<Transaction | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [formData, setFormData] = useState({
    wallet: '',
    user: '',
    type: 'add' as TransactionType,
    amount: '',
    status: 'success' as TransactionStatus,
    remarks: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      walletApi.list({ per_page: 1000 }).then((res) => setWallets(res.results)).catch(() => {});
    }
  }, [isEdit]);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (id) {
        try {
          setLoading(true);
          const tx = await transactionApi.get(id);
          setTxDetails(tx);
          setFormData({
            wallet: tx.wallet || '',
            user: tx.user || '',
            type: tx.type || 'add',
            amount: String(tx.amount ?? ''),
            status: tx.status,
            remarks: tx.remarks || '',
          });
        } catch (error) {
          toast.error('Failed to load transaction');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTransaction();
  }, [id]);

  const handleWalletChange = (walletId: string) => {
    const found = wallets.find((w) => w.id === walletId);
    setFormData((prev) => ({
      ...prev,
      wallet: walletId,
      user: found?.user || prev.user,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && id) {
        await transactionApi.edit(id, {
          status: formData.status,
          remarks: formData.remarks,
        });
        toast.success('Transaction updated successfully');
      } else {
        if (!formData.wallet || !formData.user || !formData.amount) {
          toast.error('Please select a wallet and enter an amount');
          setLoading(false);
          return;
        }
        await transactionApi.create({
          wallet: formData.wallet,
          user: formData.user,
          type: formData.type,
          amount: Number(formData.amount),
          status: formData.status,
          remarks: formData.remarks || undefined,
        });
        toast.success('Transaction created successfully');
      }
      navigate('/admin/transactions');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const walletOptions = wallets.map((w) => ({
    value: w.id,
    label: `${w.user_details?.name || w.user_details?.phone || w.user} (Rs. ${toNumber(w.balance, 0).toFixed(2)})`,
  }));

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
        subtitle={isEdit ? 'Update transaction information' : 'Create a manual wallet transaction'}
        backUrl="/admin/transactions"
      />

      <form onSubmit={handleSubmit} className="form-section max-w-xl">
        <div className="space-y-6">
          {isEdit && txDetails ? (
            <div className="p-4 rounded-lg border bg-muted/30 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User</span>
                <span className="font-medium">
                  {txDetails.user_details?.name || txDetails.user_details?.phone || txDetails.user}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{txDetails.type === 'add' ? 'Credit (+)' : 'Debit (-)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">
                  Rs. {toNumber(txDetails.amount, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-medium">
                  Rs. {toNumber(txDetails.balance_before, 0).toFixed(2)} → Rs. {toNumber(txDetails.balance_after, 0).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Wallet / User</Label>
                <SearchableSelect
                  options={walletOptions}
                  value={formData.wallet}
                  onChange={handleWalletChange}
                  placeholder="Select user wallet..."
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: TransactionType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Credit (+)</SelectItem>
                    <SelectItem value="deducted">Debit (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (Rs.)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: TransactionStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              placeholder="Transaction remarks or adjustment reason..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button type="submit" disabled={loading}>
            {isEdit ? 'Update Transaction' : 'Create Transaction'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/transactions')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

