import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import WalletCard from "@/components/app/WalletCard";
import TransactionCard from "@/components/app/TransactionCard";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { toNumber } from "@/lib/utils";

export default function UserHome() {
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
          setToReceive(toNumber(wallet.to_be_received, 0));
          setToPay(toNumber(wallet.to_be_pay, 0));
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
              <p className="text-primary-foreground/80 text-xs">Welcome back</p>
              <h1 className="text-lg font-bold text-primary-foreground">{user?.name ?? "Passenger"}</h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">{user?.name?.charAt(0) ?? "P"}</span>
            </div>
          </div>
          <WalletCard balance={balance} toReceive={toReceive} toPay={toPay} />
        </motion.div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        <Link to="/app/user/booking" className="block app-surface rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <CalendarDays size={22} className="text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Book a Ride</h3>
              <p className="text-xs text-muted-foreground">Find available EV vehicles</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground" />
          </div>
        </Link>

        <div>
          <h3 className="font-bold text-sm mb-3">Recent Bookings</h3>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((t) => (
              <TransactionCard key={t.id} transaction={t} />
            ))}
            {transactions.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No bookings yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
