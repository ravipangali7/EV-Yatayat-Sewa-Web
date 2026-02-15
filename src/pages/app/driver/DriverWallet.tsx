import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import WalletCard from "@/components/app/WalletCard";
import TransactionCard from "@/components/app/TransactionCard";
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
  const [toReceive, setToReceive] = useState(0);
  const [toPay, setToPay] = useState(0);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const run = async () => {
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
      }
    };
    run();
  }, [user?.id]);

  return (
    <div className="min-h-screen">
      <AppBar title="Wallet" />
      <div className="px-5 pt-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="app-glass-card rounded-2xl p-5 border border-border/50 mb-6">
        <WalletCard balance={balance} toReceive={toReceive} toPay={toPay} />
      </motion.div>

      <div className="mt-6">
        <h3 className="font-bold text-sm mb-3">Transaction History</h3>
        <div className="space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="app-glass-card rounded-xl p-3 border border-border/50">
              <TransactionCard transaction={t} />
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No transactions yet</p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
