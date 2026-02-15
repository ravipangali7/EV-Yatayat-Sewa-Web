import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Wallet,
  CreditCard,
  User,
  Receipt,
  PlusCircle,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import WalletCard from "@/components/app/WalletCard";
import TransactionCard from "@/components/app/TransactionCard";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import { vehicleTicketBookingApi } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import type { VehicleTicketBookingRecord } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { toNumber } from "@/lib/utils";

const gridCards = [
  { label: "Book Trip", icon: CalendarDays, to: "/app/user/booking", color: "gradient-primary" },
  { label: "My Booking", icon: FileText, to: "/app/user/booking?tab=my-booking", color: "bg-primary/20 text-primary" },
  { label: "Wallet", icon: Wallet, to: "/app/user/wallet", color: "bg-primary/20 text-primary" },
  { label: "Deposit", icon: PlusCircle, to: "/app/user/deposit", color: "bg-primary/20 text-primary" },
  { label: "Card", icon: CreditCard, to: "/app/user/card", color: "bg-primary/20 text-primary" },
  { label: "Topup Card", icon: CreditCard, to: "/app/user/card/topup", color: "bg-primary/20 text-primary" },
  { label: "Transaction", icon: Receipt, to: "/app/user/wallet", color: "bg-primary/20 text-primary" },
  { label: "Profile", icon: User, to: "/app/user/profile", color: "bg-primary/20 text-primary" },
];

export default function UserHome() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [toReceive, setToReceive] = useState(0);
  const [toPay, setToPay] = useState(0);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [myBookings, setMyBookings] = useState<VehicleTicketBookingRecord[]>([]);
  const [homeTab, setHomeTab] = useState<"bookings" | "transactions">("bookings");

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
          const [txRes, bookingsRes] = await Promise.all([
            transactionApi.list({ wallet: wallet.id, per_page: 20 }),
            vehicleTicketBookingApi.list({ user: user.id, per_page: 20, expand: true }),
          ]);
          setTransactions(txRes.results.map(transactionToAppTransaction));
          setMyBookings(bookingsRes.results ?? []);
        }
      } catch {
        setTransactions([]);
        setMyBookings([]);
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
              <p className="text-primary-foreground/80 text-xs">Welcome back</p>
              <h2 className="text-lg font-bold text-primary-foreground">{user?.name ?? "Passenger"}</h2>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">{user?.name?.charAt(0) ?? "P"}</span>
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${item.color}`}>
                  <Icon size={20} className={item.color.startsWith("gradient") ? "text-primary-foreground" : "text-primary"} />
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
              onClick={() => setHomeTab("bookings")}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                homeTab === "bookings" ? "bg-primary text-primary-foreground" : "app-glass border border-border"
              }`}
            >
              My Bookings
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
          {homeTab === "bookings" && (
            <div className="space-y-2">
              {myBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No bookings yet. Book a ride from Book Trip.</p>
              ) : (
                myBookings.slice(0, 10).map((b) => {
                  const sd = b.schedule_details;
                  return (
                    <Link
                      key={b.id}
                      to="/app/user/booking"
                      className="block app-glass-card rounded-2xl p-4 border border-border/50"
                    >
                      <p className="font-bold text-sm">PNR: {b.pnr}</p>
                      <p className="text-xs text-muted-foreground">
                        {sd?.start_point_name ?? ""} → {sd?.end_point_name ?? ""} | {sd?.date ?? ""} {sd?.time ?? ""}
                      </p>
                      <p className="text-xs mt-1">Rs. {b.price} · {b.is_paid ? "Paid" : "Unpaid"}</p>
                    </Link>
                  );
                })
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
