import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Receipt, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import WalletCard from "@/components/app/WalletCard";
import TransactionCard from "@/components/app/TransactionCard";
import TransferModal from "@/components/app/TransferModal";
import AppBar from "@/components/app/AppBar";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { toNumber } from "@/lib/utils";

export default function DriverWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [toReceive, setToReceive] = useState(0);
  const [toPay, setToPay] = useState(0);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!user?.id) return;
    setWalletLoading(true);
    try {
      const walletsRes = await walletApi.list({ user: user.id, per_page: 1 });
      const wallet = walletsRes.results[0];
      if (wallet) {
        setBalance(toNumber(wallet.balance, 0));
        setToReceive(toNumber(wallet.to_receive, 0));
        setToPay(toNumber(wallet.to_pay, 0));
        const txRes = await transactionApi.list({ wallet: wallet.id, per_page: 50 });
        setTransactions(txRes.results.map(transactionToAppTransaction));
      }
    } catch {
      setTransactions([]);
    } finally {
      setWalletLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Wallet" />
      <div className="mx-auto w-full space-y-5 px-5 pb-8 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur-xl shadow-lg shadow-primary/5 border-l-4 border-l-primary"
        >
          <WalletCard balance={balance} toReceive={toReceive} toPay={toPay} addFundLink="/app/driver/deposit" loading={walletLoading} />
        </motion.div>

        <div className="flex gap-3">
          <Link
            to="/app/driver/pay-due"
            className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--ev-danger)] text-sm font-semibold text-white"
          >
            <Receipt size={16} />
            Pay Due
          </Link>
          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
            className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--ev-info)] text-sm font-semibold text-white"
          >
            <Send size={16} />
            Transfer
          </button>
        </div>

        <TransferModal
          open={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={refreshWallet}
          currentUserId={user?.id}
        />

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction History</p>
            <Link to="/app/driver/transactions" className="flex items-center gap-1 text-xs text-primary font-medium">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl p-3 border border-border/50 hover:shadow-md hover:border-primary/20 transition-all">
                <TransactionCard transaction={t} />
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
