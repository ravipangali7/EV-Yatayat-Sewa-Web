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
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import TransactionCard from "@/components/app/TransactionCard";
import TransferModal from "@/components/app/TransferModal";
import { UserHomeMap } from "@/components/app/UserHomeMap";
import { ScheduleVehicleSearch } from "@/components/app/ScheduleVehicleSearch";
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
  { label: "History", icon: FileText, to: "booking?tab=my-booking", iconClass: "bg-primary/15 text-primary" },
  { label: "Deposit", icon: PlusCircle, to: "deposit" },
  { label: "Transfer", icon: Send, action: "transfer" as const },
  { label: "Topup Card", icon: CreditCard, to: "card/topup" },
  { label: "Card", icon: CreditCard, to: "card" },
  { label: "Wallet", icon: Wallet, to: "wallet" },
  { label: "Profile", icon: User, to: "profile" },
];

const dealerGridCards = [
  { label: "Book Trip", icon: CalendarDays, to: "booking", gradient: true },
  { label: "Booking", icon: FileText, to: "booking", iconClass: "bg-primary/15 text-primary" },
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
  const [balanceVisible, setBalanceVisible] = useState(true);
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
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium opacity-80">Welcome back</p>
            <h2 className="text-base font-bold tracking-tight truncate">{user?.name ?? "Passenger"}</h2>
          </div>
          <Link
            to={`${basePath}/wallet`}
            className="flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-2.5 py-1.5 shrink-0"
          >
            <Wallet size={14} />
            <div className="leading-tight text-right">
              <p className="text-[9px] uppercase tracking-wide opacity-80">Balance</p>
              <p className="text-sm font-bold tabular-nums">
                {balanceVisible ? `Rs. ${balance.toLocaleString()}` : "Rs. ••••"}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setBalanceVisible((v) => !v)}
            className="p-1.5 rounded-full hover:bg-white/15 shrink-0"
            aria-label={balanceVisible ? "Hide balance" : "Show balance"}
          >
            {balanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold">{user?.name?.charAt(0) ?? "P"}</span>
          </div>
        </motion.div>
      </header>

      <UserHomeMap />

      <div className="px-5 pt-4 pb-24 space-y-5 bg-background">
        <ScheduleVehicleSearch bookingPath={`${basePath}/booking`} />

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick actions</p>
        <div className="grid grid-cols-4 gap-3">
          {gridCards.map((item, idx) => {
            const Icon = item.icon;
            const key = "to" in item ? item.to + item.label : item.label;
            const iconClass =
              "iconClass" in item && item.iconClass
                ? item.iconClass
                : "gradient" in item && item.gradient
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : iconColorClasses[idx % iconColorClasses.length];
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
