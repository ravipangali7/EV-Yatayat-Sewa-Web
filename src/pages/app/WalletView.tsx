import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'add' | 'deducted'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [walletData, transactionsResponse] = await Promise.all([
          walletApi.get(id),
          transactionApi.list({ wallet: id, per_page: 250 }),
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      return true;
    });
  }, [transactions, typeFilter, statusFilter]);

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
        subtitle={wallet.user_details?.name || wallet.user_details?.phone || 'Unknown User'}
        backUrl="/admin/wallets"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/transactions?wallet=${wallet.id}&user=${wallet.user}`)}
            >
              View All in Transactions
            </Button>
            <Button onClick={() => navigate(`/admin/wallets/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
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
                Rs. {toNumber(wallet.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">To Pay</span>
              <span className="font-medium text-warning">
                Rs. {toNumber(wallet.to_pay, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">To Receive</span>
              <span className="font-medium text-success">
                Rs. {toNumber(wallet.to_receive, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'add' | 'deducted')}>
                  <SelectTrigger className="w-[115px] h-8 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="add">Credit (+)</SelectItem>
                    <SelectItem value="deducted">Debit (-)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'success' | 'pending' | 'failed')}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No transactions found</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredTransactions.map((tx) => {
                  const cardDetails = (tx as Transaction & { card_details?: { card_number?: string } }).card_details;
                  return (
                    <div
                      key={tx.id}
                      onClick={() => navigate(`/admin/transactions/${tx.id}`)}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={tx.type === 'add' ? 'default' : 'secondary'}>
                            {tx.type === 'add' ? 'Credit (+)' : 'Debit (-)'}
                          </Badge>
                          <StatusBadge status={tx.status} />
                          {cardDetails?.card_number && (
                            <Badge variant="outline" className="font-mono text-xs">
                              Card: {cardDetails.card_number}
                            </Badge>
                          )}
                        </div>
                        <span
                          className={`font-semibold ${
                            tx.type === 'add' ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {tx.type === 'add' ? '+' : '-'} Rs.{' '}
                          {toNumber(tx.amount, 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          Balance: Rs. {toNumber(tx.balance_before, 0).toFixed(2)} → Rs.{' '}
                          {toNumber(tx.balance_after, 0).toFixed(2)}
                        </div>
                        {tx.remarks && <div>Remarks: {tx.remarks}</div>}
                        <div className="text-xs flex justify-between items-center pt-1">
                          <span>{new Date(tx.created_at).toLocaleString()}</span>
                          <span className="text-muted-foreground/70">#{tx.id}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

