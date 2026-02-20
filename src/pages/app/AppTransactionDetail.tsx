import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { transactionApi } from "@/modules/transactions/services/transactionApi";
import type { Transaction } from "@/types";
import { format } from "date-fns";

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

  if (loading) {
    return (
      <div className="min-h-screen">
        <AppBar title="Transaction" showBack />
        <div className="px-5 py-8 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen">
        <AppBar title="Transaction" showBack />
        <div className="px-5 py-8 text-center text-muted-foreground">Transaction not found.</div>
      </div>
    );
  }

  const formatDate = (s: string | undefined) => {
    if (!s) return "—";
    try {
      return format(new Date(s), "MMM d, yyyy HH:mm:ss");
    } catch {
      return s;
    }
  };

  return (
    <div className="min-h-screen">
      <AppBar title="Transaction Details" showBack />
      <div className="px-5 pt-4 pb-24 space-y-4">
        <div className="app-glass-card rounded-2xl p-4 border border-border/50 space-y-3">
          <h3 className="font-semibold text-sm border-b border-border pb-2">Transaction</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium">{transaction.type === "add" ? "Credit" : "Debit"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">Rs. {Number(transaction.amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{transaction.status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance Before</span>
            <span className="font-medium">Rs. {Number(transaction.balance_before).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance After</span>
            <span className="font-medium">Rs. {Number(transaction.balance_after).toLocaleString()}</span>
          </div>
          {transaction.remarks && (
            <div className="pt-2 border-t border-border">
              <span className="text-muted-foreground text-sm block mb-1">Remarks</span>
              <p className="text-sm">{transaction.remarks}</p>
            </div>
          )}
        </div>

        <div className="app-glass-card rounded-2xl p-4 border border-border/50 space-y-3">
          <h3 className="font-semibold text-sm border-b border-border pb-2">Record</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">{formatDate(transaction.created_at)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Updated</span>
            <span className="font-medium">{formatDate(transaction.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
