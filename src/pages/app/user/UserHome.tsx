import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import TransactionCard from "@/components/app/TransactionCard";
import TransferModal from "@/components/app/TransferModal";
import { UserHomeMap } from "@/components/app/UserHomeMap";
import { ScheduleVehicleSearch } from "@/components/app/ScheduleVehicleSearch";
import { HomeHeader } from "@/components/app/HomeHeader";
import { SvgIcon } from "@/components/app/ride/SvgIcon";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import { vehicleTicketBookingApi } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import type { VehicleTicketBookingRecord } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { AppTransaction } from "@/components/app/TransactionCard";
import { toNumber } from "@/lib/utils";
import { resolveAppRole, getAppRoleConfig } from "@/config/appRoles";
const userGridCards = [
  { label: "Book Trip", icon: "bus", to: "booking" },
  { label: "History", icon: "file-text", to: "booking?tab=my-booking" },
  { label: "Deposit", icon: "circle-plus", to: "deposit" },
  { label: "Transfer", icon: "send", action: "transfer" as const },
  { label: "Topup Card", icon: "credit-card", to: "card/topup" },
  { label: "Card", icon: "credit-card", to: "card" },
  { label: "Wallet", icon: "wallet", to: "wallet" },
  { label: "Profile", icon: "user", to: "profile" },
];

const dealerGridCards = [
  { label: "Book Trip", icon: "bus", to: "booking" },
  { label: "Booking", icon: "file-text", to: "booking" },
  { label: "Deposit", icon: "circle-plus", to: "deposit" },
  { label: "Transfer", icon: "send", action: "transfer" as const },
  { label: "Revenue", icon: "trending-up", to: "revenue" },
  { label: "Card", icon: "credit-card", to: "card" },
  { label: "Wallet", icon: "wallet", to: "wallet" },
  { label: "Profile", icon: "user", to: "profile" },
];

export default function UserHome() {
  const { user } = useAuth();
  const role = resolveAppRole(user);
  const config = role ? getAppRoleConfig(role) : null;
  const basePath = config?.basePath ?? "/app/user";
  const gridCards = role === "ticket_dealer" ? dealerGridCards : userGridCards;
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [myBookings, setMyBookings] = useState<VehicleTicketBookingRecord[]>([]);
  const [homeTab, setHomeTab] = useState<"bookings" | "transactions">("bookings");
  const [showTransferModal, setShowTransferModal] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!user?.id) return;
    setBalanceLoading(true);
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
    } finally {
      setBalanceLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <div className="min-h-screen">
      <HomeHeader
        name={user?.name ?? "Passenger"}
        tagline="Travel smart. Travel green."
        balance={balance}
        balanceLoading={balanceLoading}
        balanceVisible={balanceVisible}
        onToggleBalance={() => setBalanceVisible((v) => !v)}
        walletPath={`${basePath}/wallet`}
        profilePath={`${basePath}/profile`}
        profilePicture={user?.profile_picture}
      />
      <div className="mx-auto w-full space-y-5 px-5 pb-5 pt-4">
        <ScheduleVehicleSearch bookingPath={`${basePath}/booking`} />

        <section className="overflow-hidden rounded-2xl border border-[#E4EEE8] bg-white shadow-sm">
          <UserHomeMap />
        </section>

        <p className="text-xs font-semibold uppercase tracking-wider text-[#6D7B74]">Quick actions</p>
        <div className="grid grid-cols-4 gap-3">
          {gridCards.map((item) => {
            const key = "to" in item ? item.to + item.label : item.label;
            const tile = (
              <>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F8EC] text-[#1C8C42]">
                  <SvgIcon name={item.icon} className="h-5 w-5" />
                </div>
                <span className="text-center text-[11px] font-medium leading-tight text-[#163024]">{item.label}</span>
              </>
            );
            if ("action" in item && item.action === "transfer") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="flex flex-col items-center justify-center rounded-2xl border border-[#E4EEE8] bg-white p-3 shadow-sm"
                >
                  {tile}
                </button>
              );
            }
            const to = `${basePath}/${(item as { to: string }).to}`.replace(/\/+/g, "/");
            return (
              <Link
                key={key}
                to={to}
                className="flex flex-col items-center justify-center rounded-2xl border border-[#E4EEE8] bg-white p-3 shadow-sm"
              >
                {tile}
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
          <div className="mb-3 flex gap-2 rounded-xl border border-[#E4EEE8] bg-white p-1 shadow-sm">
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
