import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTransaction, updateTransaction } from '@/stores/mockData';
import { TransactionStatus } from '@/types';
import { toast } from 'sonner';

export default function TransactionForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    status: 'pending' as TransactionStatus,
    remarks: '',
  });

  useEffect(() => {
    if (id) {
      const tx = getTransaction(id);
      if (tx) {
        setFormData({
          status: tx.status,
          remarks: tx.remarks || '',
        });
      }
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (id) {
      updateTransaction(id, formData);
      toast.success('Transaction updated successfully');
    }
    navigate('/app/transactions');
  };

  return (
    <div>
      <PageHeader
        title="Edit Transaction"
        subtitle="Update transaction information"
        backUrl="/app/transactions"
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
          <Button type="submit">Update Transaction</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/transactions')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
