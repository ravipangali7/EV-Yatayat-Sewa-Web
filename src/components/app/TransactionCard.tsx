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
    <div className="flex items-center gap-3 p-3 app-surface rounded-xl">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isCredit ? "bg-accent" : "bg-destructive/10"
        }`}
      >
        {isCredit ? (
          <ArrowDownLeft size={18} className="text-primary" />
        ) : (
          <ArrowUpRight size={18} className="text-destructive" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{transaction.title}</p>
        <p className="text-xs text-muted-foreground">{transaction.subtitle}</p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-bold ${
            isCredit ? "text-primary" : "text-destructive"
          }`}
        >
          {isCredit ? "+" : "-"} Rs. {transaction.amount}
        </p>
        <p className="text-[10px] text-muted-foreground">{transaction.date}</p>
      </div>
    </div>
  );
};

export default TransactionCard;
