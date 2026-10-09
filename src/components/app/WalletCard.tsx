import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";

interface WalletCardProps {
  balance: number;
  toReceive: number;
  toPay: number;
  addFundLink?: string;
  loading?: boolean;
}

function money(value: number) {
  return `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const WalletCard = ({ balance, toReceive, toPay, addFundLink, loading }: WalletCardProps) => {
  return (
    <div className="ev-wallet-card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white/90">Wallet Balance</span>
        {addFundLink && (
          <Link
            to={addFundLink}
            className="flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Plus size={14} />
            Add Fund
          </Link>
        )}
      </div>
      {loading ? (
        <div className="mb-6 h-9 w-40 animate-pulse rounded-lg bg-white/25" />
      ) : (
        <p className="mb-6 text-[28px] font-bold tabular-nums">{money(balance)}</p>
      )}
      <div className="flex justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <ArrowDownLeft size={14} />
          </div>
          <div>
            <p className="text-[10px] text-white/75">To Receive</p>
            <p className="text-sm font-semibold tabular-nums">{loading ? "—" : money(toReceive)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${toPay > 0 ? "bg-[var(--ev-danger)]/30" : "bg-white/20"}`}>
            <ArrowUpRight size={14} />
          </div>
          <div>
            <p className="text-[10px] text-white/75">To Pay</p>
            <p className="text-sm font-semibold tabular-nums">{loading ? "—" : money(toPay)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
