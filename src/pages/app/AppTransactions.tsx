import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Receipt, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { resolveAppRole, getAppRoleConfig } from "@/config/appRoles";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import type { Transaction } from "@/types";
import { format, subDays } from "date-fns";

type DatePreset = "7" | "30" | "custom" | "all";

export default function AppTransactions() {
  const { user } = useAuth();
  const role = resolveAppRole(user);
  const config = role ? getAppRoleConfig(role) : null;
  const basePath = config?.basePath ?? "/app/user";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("30");
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const walletsRes = await walletApi.list({ user: user.id, per_page: 1 });
      const wallet = walletsRes.results[0];
      if (!wallet) {
        setTransactions([]);
        return;
      }
      const params: Parameters<typeof transactionApi.list>[0] = {
        wallet: wallet.id,
        per_page: 100,
      };
      if (search.trim()) params.search = search.trim();
      if (datePreset === "7") {
        params.date_from = format(subDays(new Date(), 7), "yyyy-MM-dd");
        params.date_to = format(new Date(), "yyyy-MM-dd");
      } else if (datePreset === "30") {
        params.date_from = format(subDays(new Date(), 30), "yyyy-MM-dd");
        params.date_to = format(new Date(), "yyyy-MM-dd");
      } else if (datePreset === "custom") {
        params.date_from = dateFrom;
        params.date_to = dateTo;
      }
      const res = await transactionApi.list(params);
      setTransactions(res.results ?? []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, search, datePreset, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const formatDate = (s: string | undefined) => {
    if (!s) return "—";
    try {
      return format(new Date(s), "MMM d, yyyy HH:mm");
    } catch {
      return s;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Transactions" showBack />
      <div className="px-5 pt-4 pb-24">
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-white dark:bg-card/80 border-border/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["7", "30", "custom", "all"] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  datePreset === preset
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
                }`}
                onClick={() => setDatePreset(preset)}
              >
                {preset === "7" ? "7 days" : preset === "30" ? "30 days" : preset === "custom" ? "Custom" : "All time"}
              </button>
            ))}
            {datePreset === "custom" && (
              <div className="flex items-center gap-1 w-full">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 h-8 text-xs rounded-lg" />
                <span className="text-muted-foreground">–</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 h-8 text-xs rounded-lg" />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Receipt size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => {
              const isCredit = t.type === "add";
              return (
                <Link key={t.id} to={`${basePath}/transactions/${t.id}`} className="block">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-card/80 rounded-xl p-3.5 border border-border/50 hover:border-border hover:shadow-sm transition-all flex items-center gap-3"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "icon-emerald" : "icon-rose"}`}>
                      <Receipt size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.remarks ?? (isCredit ? "Credit" : "Debit")}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {isCredit ? "+" : "-"}Rs. {Number(t.amount).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t.status}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
