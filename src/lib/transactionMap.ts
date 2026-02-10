import { Transaction } from "@/types";
import type { AppTransaction } from "@/components/app/TransactionCard";

export function transactionToAppTransaction(t: Transaction): AppTransaction {
  const isCredit = t.type === "add";
  const date = new Date(t.created_at);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const dateStr = isToday ? "Today" : date.toLocaleDateString();
  return {
    id: t.id,
    type: isCredit ? "credit" : "debit",
    title: t.remarks ?? (isCredit ? "Credit" : "Debit"),
    subtitle: t.wallet_details?.user_details?.name ?? "",
    amount: typeof t.amount === "number" ? t.amount : Number(t.amount) || 0,
    date: dateStr,
  };
}
