import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Wallet,
  CreditCard,
  User,
  PlusCircle,
  FileText,
  Send,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import WalletCard from "@/components/app/WalletCard";
import TransactionCard from "@/components/app/TransactionCard";
import TransferModal from "@/components/app/TransferModal";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import { vehicleTicketBookingApi } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import type { VehicleTicketBookingRecord } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { toNumber } from "@/lib/utils";
import { resolveAppRole, getAppRoleConfig } from "@/config/appRoles";
import { iconColorClasses } from "@/lib/appHomeStyles";

const userGridCards = [
  { label: "Book Trip", icon: CalendarDays, to: "booking", gradient: true },
  { label: "My Booking", icon: FileText, to: "booking?tab=my-booking" },
  { label: "Deposit", icon: PlusCircle, to: "deposit" },
  { label: "Transfer", icon: Send, action: "transfer" as const },
  { label: "Topup Card", icon: CreditCard, to: "card/topup" },
  { label: "Card", icon: CreditCard, to: "card" },
  { label: "Wallet", icon: Wallet, to: "wallet" },
  { label: "Profile", icon: User, to: "profile" },
];

const dealerGridCards = [
  { label: "Book Trip", icon: CalendarDays, to: "booking", gradient: true },
  { label: "Booking", icon: FileText, to: "booking" },
  { label: "Deposit", icon: PlusCircle, to: "deposit" },
  { label: "Transfer", icon: Send, action: "transfer" as const },
  { label: "Revenue", icon: TrendingUp, to: "revenue" },
  { label: "Card", icon: CreditCard, to: "card" },
  { label: "Wallet", icon: Wallet, to: "wallet" },
  { label: "Profile", icon: User, to: "profile" },
];

export default function UserHome() {
  const { user } = useAuth();
  const role = resolveAppRole(user);
  const config = role ? getAppRoleConfig(role) : null;
  const basePath = config?.basePath ?? "/app/user";
  const gridCards = role === "ticket_dealer" ? dealerGridCards : userGridCards;
  const [balance, setBalance] = useState(0);
  const [toReceive, setToReceive] = useState(0);
  const [toPay, setToPay] = useState(0);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [myBookings, setMyBookings] = useState<VehicleTicketBookingRecord[]>([]);
  const [homeTab, setHomeTab] = useState<"bookings" | "transactions">("bookings");
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
  }, [user?.id]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <div className="min-h-screen bg-background">
      {/* White header with green accent - modern */}
      <div className="bg-white dark:bg-card border-b border-border shadow-sm">
        <div className="px-5 pt-5 pb-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium">Welcome back</p>
              <h2 className="text-xl font-bold text-foreground tracking-tight">{user?.name ?? "Passenger"}</h2>
            </div>
            <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center ring-2 ring-primary/5">
              <span className="text-sm font-bold text-primary">{user?.name?.charAt(0) ?? "P"}</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl overflow-hidden border border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur-xl shadow-lg shadow-primary/5 border-l-4 border-l-primary">
            <WalletCard balance={balance} toReceive={toReceive} toPay={toPay} addFundLink={`${basePath}/deposit`} />
          </motion.div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-24 space-y-5 bg-background">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick actions</p>
        <div className="grid grid-cols-4 gap-3">
          {gridCards.map((item, idx) => {
            const Icon = item.icon;
            const key = "to" in item ? item.to + item.label : item.label;
            const iconClass = "gradient" in item && item.gradient ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : iconColorClasses[idx % iconColorClasses.length];
            if ("action" in item && item.action === "transfer") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="bg-white dark:bg-card/80 backdrop-blur-xl flex flex-col items-center justify-center p-4 rounded-2xl border border-border/50 hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${iconClass}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[11px] font-medium text-center leading-tight text-foreground">{item.label}</span>
                </button>
              );
            }
            const to = `${basePath}/${(item as { to: string }).to}`.replace(/\/+/g, "/");
            return (
              <Link
                key={key}
                to={to}
                className="bg-white dark:bg-card/80 backdrop-blur-xl flex flex-col items-center justify-center p-4 rounded-2xl border border-border/50 hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${iconClass}`}>
                  <Icon size={20} />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight text-foreground">{item.label}</span>
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
          <div className="flex gap-2 mb-3 p-1 rounded-xl bg-muted/30 border border-border/50">
            <button
              type="button"
              onClick={() => setHomeTab("bookings")}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                homeTab === "bookings" ? "bg-white dark:bg-card shadow-sm text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Bookings
            </button>
            <button
              type="button"
              onClick={() => setHomeTab("transactions")}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                homeTab === "transactions" ? "bg-white dark:bg-card shadow-sm text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
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
                      to={`${basePath}/booking`}
                      className="block bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl p-4 border border-border/50 hover:border-primary/20 transition-colors"
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
                  <div key={t.id} className="bg-white dark:bg-card/80 backdrop-blur-xl rounded-xl p-3 border border-border/50">
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
