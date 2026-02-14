import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Car, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import WalletCard from "@/components/app/WalletCard";
import TransactionCard from "@/components/app/TransactionCard";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { toNumber } from "@/lib/utils";

export default function DriverHome() {
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
          const txRes = await transactionApi.list({ wallet: wallet.id, per_page: 10 });
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
      <div className="gradient-primary pt-12 pb-8 px-5 rounded-b-[2rem]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-primary-foreground/80 text-xs">Good Morning</p>
              <h1 className="text-lg font-bold text-primary-foreground">{user?.name ?? "Driver"}</h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">{user?.name?.charAt(0) ?? "D"}</span>
            </div>
          </div>
          <WalletCard balance={balance} toReceive={toReceive} toPay={toPay} />
        </motion.div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/app/driver/vehicle" className="app-surface rounded-2xl p-4 border border-border flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Car size={20} className="text-primary" />
            </div>
            <span className="text-xs font-semibold">My Vehicle</span>
          </Link>
          <Link to="/app/driver/wallet" className="app-surface rounded-2xl p-4 border border-border flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Clock size={20} className="text-primary" />
            </div>
            <span className="text-xs font-semibold">Trip History</span>
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Recent Transactions</h3>
            <Link to="/app/driver/wallet" className="text-xs text-primary font-medium flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((t) => (
              <TransactionCard key={t.id} transaction={t} />
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
