import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export interface AppTransaction {
  id: string;
  type: "credit" | "debit";
  title: string;
  subtitle: string;
  amount: number;
  date: string;
}

interface TransactionCardProps {
  transaction: AppTransaction;
}

const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const isCredit = transaction.type === "credit";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isCredit ? "icon-emerald" : "icon-rose"
        }`}
      >
        {isCredit ? (
          <ArrowDownLeft size={16} />
        ) : (
          <ArrowUpRight size={16} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{transaction.title}</p>
        <p className="text-xs text-muted-foreground truncate">{transaction.subtitle}</p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-bold ${
            isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {isCredit ? "+" : "-"} Rs. {transaction.amount.toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground">{transaction.date}</p>
      </div>
    </div>
  );
};

export default TransactionCard;
