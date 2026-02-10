import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { transactionApi } from '@/modules/transactions/services/transactionApi';
import { TransactionStatus } from '@/types';
import { toast } from 'sonner';

export default function TransactionForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    status: 'pending' as TransactionStatus,
    remarks: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (id) {
        try {
          setLoading(true);
          const tx = await transactionApi.get(id);
          setFormData({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await transactionApi.edit(id, formData);
        toast.success('Transaction updated successfully');
      }
      navigate('/admin/transactions');
    } catch (error) {
      console.error(error);
      // Error is already handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Edit Transaction"
        subtitle="Update transaction information"
        backUrl="/admin/transactions"
      />

      <form onSubmit={handleSubmit} className="form-section max-w-xl">
        <div className="space-y-6">
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
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button type="submit" disabled={loading}>Update Transaction</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/transactions')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
