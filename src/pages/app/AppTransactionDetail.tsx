import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import type { Transaction } from "@/types";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

export default function AppTransactionDetail() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    transactionApi
      .get(id)
      .then(setTransaction)
      .catch(() => setTransaction(null))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (s: string | undefined) => {
    if (!s) return "—";
    try { return format(new Date(s), "MMM d, yyyy HH:mm:ss"); }
    catch { return s; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar title="Transaction" showBack />
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background">
        <AppBar title="Transaction" showBack />
        <div className="px-5 py-12 text-center text-muted-foreground">Transaction not found.</div>
      </div>
    );
  }

  const isCredit = transaction.type === "add";

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Transaction Details" showBack />
      <div className="px-5 pt-6 pb-24 space-y-4">
        <div className={`rounded-2xl border border-l-4 p-5 text-center ${isCredit ? "border-emerald-200 dark:border-emerald-800 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10" : "border-rose-200 dark:border-rose-800 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/10"}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${isCredit ? "icon-emerald" : "icon-rose"}`}>
            {isCredit ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
          </div>
          <p className={`text-2xl font-bold mb-1 ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {isCredit ? "+" : "-"}Rs. {Number(transaction.amount).toLocaleString()}
          </p>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isCredit ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
            {isCredit ? "Credit" : "Debit"}
          </span>
        </div>

        <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Transaction Details</p>
          <DetailRow label="Status" value={transaction.status} />
          <DetailRow label="Balance Before" value={`Rs. ${Number(transaction.balance_before).toLocaleString()}`} />
          <DetailRow label="Balance After" value={`Rs. ${Number(transaction.balance_after).toLocaleString()}`} />
          {transaction.remarks && <DetailRow label="Remarks" value={transaction.remarks} />}
        </div>

        <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Record</p>
          <DetailRow label="Created" value={formatDate(transaction.created_at)} />
          <DetailRow label="Updated" value={formatDate(transaction.updated_at)} />
        </div>
      </div>
    </div>
  );
}
