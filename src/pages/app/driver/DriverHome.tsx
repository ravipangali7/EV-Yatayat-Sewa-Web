import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Car,
  Wallet,
  User,
  CreditCard,
  Receipt,
  FileText,
  Clock,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import WalletCard from "@/components/app/WalletCard";
import TransactionCard from "@/components/app/TransactionCard";
import TransferModal from "@/components/app/TransferModal";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import { seatBookingApi } from "@/modules/seat-bookings/services/seatBookingApi";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { toNumber } from "@/lib/utils";

const gridCards = [
  { label: "Vehicle", icon: Car, to: "/app/driver/vehicle" },
  { label: "Trip History", icon: Clock, to: "/app/driver/trip-history" },
  { label: "Seat Booking", icon: FileText, to: "/app/driver/seat-booking" },
  { label: "Deposit", icon: CreditCard, to: "/app/driver/wallet" },
  { label: "Pay Due", icon: Receipt, to: "/app/driver/pay-due" },
  { label: "Transfer", icon: Send, action: "transfer" as const },
  { label: "Wallet", icon: Wallet, to: "/app/driver/wallet" },
  { label: "Profile", icon: User, to: "/app/driver/profile" },
];

export default function DriverHome() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [toReceive, setToReceive] = useState(0);
  const [toPay, setToPay] = useState(0);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [seatBookings, setSeatBookings] = useState<unknown[]>([]);
  const [homeTab, setHomeTab] = useState<"seat-bookings" | "transactions">("seat-bookings");
  const [showTransferModal, setShowTransferModal] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!user?.id) return;
    try {
      const walletsRes = await walletApi.list({ user: user.id, per_page: 1 });
      const wallet = walletsRes.results[0];
      if (wallet) {
        setBalance(toNumber(wallet.balance, 0));
        setToReceive(toNumber(wallet.to_receive, 0));
        setToPay(toNumber(wallet.to_pay, 0));
        const [txRes, sbRes] = await Promise.all([
          transactionApi.list({ wallet: wallet.id, per_page: 20 }),
          seatBookingApi.list({ driver: user.id, per_page: 20 }).catch(() => ({ results: [] })),
        ]);
        setTransactions(txRes.results.map(transactionToAppTransaction));
        setSeatBookings((sbRes as { results: unknown[] }).results ?? []);
      }
    } catch {
      setTransactions([]);
      setSeatBookings([]);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <div className="min-h-screen">
      <AppBar title="EV Yatayat Sewa" />
      <div className="gradient-primary pt-6 pb-8 px-5 rounded-b-[2rem]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-primary-foreground/80 text-xs">Good Morning</p>
              <h2 className="text-lg font-bold text-primary-foreground">{user?.name ?? "Driver"}</h2>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">{user?.name?.charAt(0) ?? "D"}</span>
            </div>
          </div>
          <WalletCard balance={balance} toReceive={toReceive} toPay={toPay} />
        </motion.div>
      </div>

      <div className="px-5 pt-5 pb-24 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          {gridCards.map((item) => {
            const Icon = item.icon;
            const key = "to" in item ? item.to + item.label : item.label;
            if ("action" in item && item.action === "transfer") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="app-glass-card flex flex-col items-center justify-center p-4 rounded-2xl border border-border/50 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-2">
                    <Icon size={20} className="text-accent-foreground" />
                  </div>
                  <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
                </button>
              );
            }
            return (
              <Link
                key={key}
                to={(item as { to: string }).to}
                className="app-glass-card flex flex-col items-center justify-center p-4 rounded-2xl border border-border/50 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-2">
                  <Icon size={20} className="text-accent-foreground" />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <TransferModal
          open={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={refreshWallet}
          currentUserId={user?.id}
        />

        <div>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setHomeTab("seat-bookings")}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                homeTab === "seat-bookings" ? "bg-primary text-primary-foreground" : "app-glass border border-border"
              }`}
            >
              Seat Bookings
            </button>
            <button
              type="button"
              onClick={() => setHomeTab("transactions")}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                homeTab === "transactions" ? "bg-primary text-primary-foreground" : "app-glass border border-border"
              }`}
            >
              Transactions
            </button>
          </div>
          {homeTab === "seat-bookings" && (
            <div className="space-y-2">
              {seatBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No seat bookings yet</p>
              ) : (
                seatBookings.slice(0, 10).map((sb: unknown, i) => (
                  <div key={i} className="app-glass-card rounded-2xl p-4 border border-border/50">
                    <p className="text-sm font-medium">Seat booking #{String((sb as { id?: string }).id ?? i + 1)}</p>
                    <p className="text-xs text-muted-foreground">View in Vehicle / Trip</p>
                  </div>
                ))
              )}
            </div>
          )}
          {homeTab === "transactions" && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No transactions yet</p>
              ) : (
                transactions.slice(0, 10).map((t) => (
                  <div key={t.id} className="app-glass-card rounded-xl p-3 border border-border/50">
                    <TransactionCard transaction={t} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
