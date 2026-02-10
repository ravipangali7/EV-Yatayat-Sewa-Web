import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { walletApi } from '@/modules/wallets/services/walletApi';
import { transactionApi } from '@/modules/transactions/services/transactionApi';
import { Wallet, Transaction } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function WalletView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [walletData, transactionsResponse] = await Promise.all([
          walletApi.get(id),
          transactionApi.list({ wallet: id, per_page: 100 }),
        ]);
        setWallet(walletData);
        setTransactions(transactionsResponse.results);
      } catch (error) {
        toast.error('Failed to load wallet data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading wallet...</p>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Wallet not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/wallets')}>
          Back to Wallets
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Wallet Details"
        subtitle={wallet.user_details?.name || 'Unknown User'}
        backUrl="/admin/wallets"
        actions={
          <Button onClick={() => navigate(`/admin/wallets/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallet Information */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">User</span>
              <span className="font-medium">
                {wallet.user_details?.name || wallet.user_details?.username || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{wallet.user_details?.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-medium text-lg">
                ${toNumber(wallet.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">To Be Paid</span>
              <span className="font-medium text-warning">
                ${toNumber(wallet.to_be_pay, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">To Be Received</span>
              <span className="font-medium text-success">
                ${toNumber(wallet.to_be_received, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Created At</span>
              <span className="font-medium text-sm">
                {new Date(wallet.created_at).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No transactions found</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={tx.type === 'add' ? 'default' : 'secondary'}>
                          {tx.type === 'add' ? 'Credit' : 'Debit'}
                        </Badge>
                        <StatusBadge status={tx.status} />
                      </div>
                      <span
                        className={`font-semibold ${
                          tx.type === 'add' ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {tx.type === 'add' ? '+' : '-'}$
                        {toNumber(tx.amount, 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Balance: ${toNumber(tx.balance_before, 0).toFixed(2)} → $
                        {toNumber(tx.balance_after, 0).toFixed(2)}
                      </div>
                      {tx.remarks && <div>Remarks: {tx.remarks}</div>}
                      <div className="text-xs">
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
