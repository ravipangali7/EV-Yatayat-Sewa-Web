import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { transactionApi } from '@/modules/transactions/services/transactionApi';
import { Transaction } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function TransactionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const transactionData = await transactionApi.get(id);
        setTransaction(transactionData);
      } catch (error) {
        toast.error('Failed to load transaction');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading transaction...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Transaction not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/transactions')}>
          Back to Transactions
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Transaction Details"
        subtitle={`Transaction #${transaction.id}`}
        backUrl="/admin/transactions"
        actions={
          <Button onClick={() => navigate(`/admin/transactions/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Information */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={transaction.status} />
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Type</span>
              <Badge variant={transaction.type === 'add' ? 'default' : 'secondary'}>
                {transaction.type === 'add' ? 'Credit' : 'Debit'}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Amount</span>
              <span
                className={`font-semibold text-lg ${
                  transaction.type === 'add' ? 'text-success' : 'text-destructive'
                }`}
              >
                {transaction.type === 'add' ? '+' : '-'}$
                {toNumber(transaction.amount, 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Balance Before</span>
              <span className="font-medium">
                ${toNumber(transaction.balance_before, 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Balance After</span>
              <span className="font-medium">
                ${toNumber(transaction.balance_after, 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {transaction.remarks && (
              <div className="flex justify-between items-start py-2 border-b border-border">
                <span className="text-muted-foreground">Remarks</span>
                <span className="font-medium text-right max-w-xs">{transaction.remarks}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Created At</span>
              <span className="font-medium text-sm">
                {new Date(transaction.created_at).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* User & Wallet Information */}
        <Card>
          <CardHeader>
            <CardTitle>User & Wallet Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">User</h4>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">
                    {transaction.user_details?.name || transaction.user_details?.username || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{transaction.user_details?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{transaction.user_details?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Wallet</h4>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-medium">
                    ${toNumber(transaction.wallet_details?.balance || 0, 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">To Pay</span>
                  <span className="font-medium">
                    ${toNumber(transaction.wallet_details?.to_pay || 0, 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">To Receive</span>
                  <span className="font-medium">
                    ${toNumber(transaction.wallet_details?.to_receive || 0, 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
