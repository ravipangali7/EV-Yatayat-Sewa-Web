import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import WalletCard from "@/components/app/WalletCard";
import TransactionCard from "@/components/app/TransactionCard";
import { HomeHeader } from "@/components/app/HomeHeader";
import { SvgIcon } from "@/components/app/ride/SvgIcon";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import { seatBookingApi } from "@/modules/seat-bookings/services/seatBookingApi";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { toNumber } from "@/lib/utils";

const gridCards = [
  { label: "Vehicle", icon: "car", to: "/app/driver/vehicle" },
  { label: "Trip History", icon: "clock", to: "/app/driver/trip-history" },
  { label: "Seat Booking", icon: "file-text", to: "/app/driver/seat-booking" },
  { label: "Map", icon: "map-pin", to: "/app/driver/vehicle" },
  { label: "Deposit", icon: "credit-card", to: "/app/driver/deposit" },
  { label: "Pay Dues", icon: "receipt", to: "/app/driver/pay-due" },
  { label: "Wallet", icon: "wallet", to: "/app/driver/wallet" },
  { label: "Profile", icon: "user", to: "/app/driver/profile" },
];

export default function DriverHome() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [toReceive, setToReceive] = useState(0);
  const [toPay, setToPay] = useState(0);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [seatBookings, setSeatBookings] = useState<unknown[]>([]);
  const [homeTab, setHomeTab] = useState<"seat-bookings" | "transactions">("seat-bookings");

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
    } finally {
      setWalletLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <div className="min-h-screen">
      <HomeHeader
        eyebrow="On duty"
        name={user?.name ?? "Driver"}
        avatarInitial={user?.name?.charAt(0) ?? "D"}
      />
      <div className="mx-auto w-full space-y-5 px-5 py-5">
        <div className="overflow-hidden rounded-2xl border border-[#E4EEE8] border-l-4 border-l-[#1C8C42] bg-white shadow-sm">
          <WalletCard balance={balance} toReceive={toReceive} toPay={toPay} addFundLink="/app/driver/deposit" loading={walletLoading} />
        </div>
        {!walletLoading && toPay > 0 && (
          <Link
            to="/app/driver/pay-due"
            className="flex items-center justify-between rounded-xl border border-[var(--ev-danger)]/20 bg-[var(--ev-danger-soft)] px-4 py-3 text-sm text-[var(--ev-danger)]"
          >
            <span>Outstanding due Rs. {toPay.toLocaleString()}</span>
            <span className="font-semibold">Pay now</span>
          </Link>
        )}
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6D7B74]">Quick actions</p>
        <div className="grid grid-cols-4 gap-3">
          {gridCards.map((item) => (
            <Link
              key={item.to + item.label}
              to={item.to}
              className="flex flex-col items-center justify-center rounded-2xl border border-[#E4EEE8] bg-white p-3 shadow-sm"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F8EC] text-[#1C8C42]">
                <SvgIcon name={item.icon} className="h-5 w-5" />
              </div>
              <span className="text-center text-[11px] font-medium leading-tight text-[#163024]">{item.label}</span>
            </Link>
          ))}
        </div>

        <div>
          <div className="mb-3 flex gap-2 rounded-xl border border-[#E4EEE8] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setHomeTab("seat-bookings")}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                homeTab === "seat-bookings" ? "bg-white dark:bg-card shadow-sm text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Seat Bookings
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
          {homeTab === "seat-bookings" && (
            <div className="space-y-2">
              {seatBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No seat bookings yet</p>
              ) : (
                seatBookings.slice(0, 10).map((sb: unknown, i) => (
                  <div key={i} className="bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl p-4 border border-border/50">
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
