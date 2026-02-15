import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Car,
  Wallet,
  User,
  MapPin,
  CreditCard,
  Receipt,
  FileText,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import WalletCard from "@/components/app/WalletCard";
import TransactionCard from "@/components/app/TransactionCard";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import { seatBookingApi } from "@/modules/seat-bookings/services/seatBookingApi";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { toNumber } from "@/lib/utils";

const gridCards = [
  { label: "Vehicle", icon: Car, to: "/app/driver/vehicle" },
  { label: "Trip History", icon: Clock, to: "/app/driver/wallet" },
  { label: "Seat Booking", icon: FileText, to: "/app/driver/vehicle" },
  { label: "Map", icon: MapPin, to: "/app/driver/vehicle" },
  { label: "Deposit", icon: CreditCard, to: "/app/driver/wallet" },
  { label: "Pay Dues", icon: Receipt, to: "/app/driver/wallet" },
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
          const [txRes, sbRes] = await Promise.all([
            transactionApi.list({ wallet: wallet.id, per_page: 20 }),
            seatBookingApi.list({ user: user.id, per_page: 20 }).catch(() => ({ results: [] })),
          ]);
          setTransactions(txRes.results.map(transactionToAppTransaction));
          setSeatBookings((sbRes as { results: unknown[] }).results ?? []);
        }
      } catch {
        setTransactions([]);
        setSeatBookings([]);
      }
    };
    run();
  }, [user?.id]);

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

      <div className="px-5 pt-5 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          {gridCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to + item.label}
                to={item.to}
                className="app-glass-card flex flex-col items-center justify-center p-4 rounded-2xl border border-border/50 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-2">
                  <Icon size={20} />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>

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
                  <TransactionCard key={t.id} transaction={t} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
