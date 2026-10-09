import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { LogoMark } from "@/components/brand/LogoMark";

function BrandRow() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <LogoMark size={36} className="shrink-0" />
      <div className="min-w-0 leading-tight">
        <p className="ev-wordmark truncate text-[15px] font-bold text-[var(--ev-primary)]">EV Yatayat</p>
        <p className="truncate text-[11px] font-medium text-[var(--ev-primary-dark)]">Go Electric. Go Smarter.</p>
      </div>
    </div>
  );
}

export function HomeHeader({
  eyebrow,
  name,
  balance,
  balanceLoading,
  balanceVisible,
  onToggleBalance,
  walletPath,
  avatarInitial,
}: {
  eyebrow: string;
  name: string;
  balance?: number;
  balanceLoading?: boolean;
  balanceVisible?: boolean;
  onToggleBalance?: () => void;
  walletPath?: string;
  avatarInitial?: string;
}) {
  const showBalance = walletPath != null;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--ev-border)] bg-[var(--ev-bg)]/95 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
      <BrandRow />
      <div className="mt-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ev-text-muted)]">
            {avatarInitial != null && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ev-primary)]" aria-hidden />
            )}
            {eyebrow}
          </p>
          <p className="truncate text-[17px] font-bold leading-snug text-[var(--ev-text)]">{name}</p>
        </div>

        {showBalance ? (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={walletPath}
              className="rounded-full border border-[var(--ev-border)] bg-[var(--ev-surface)] px-3 py-1.5 shadow-[var(--ev-shadow-card)]"
            >
              <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--ev-text-muted)]">
                Balance
              </span>
              <span className="mt-0.5 block text-[13px] font-bold leading-none tabular-nums text-[var(--ev-primary)]">
                {balanceLoading ? (
                  <span className="inline-block h-3.5 w-16 animate-pulse rounded bg-[var(--ev-mint-100)]" />
                ) : balanceVisible ? (
                  `Rs. ${Number(balance ?? 0).toLocaleString()}`
                ) : (
                  "Rs. ••••"
                )}
              </span>
            </Link>
            <button
              type="button"
              onClick={onToggleBalance}
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--ev-border)] bg-[var(--ev-surface)] text-[var(--ev-primary)] shadow-[var(--ev-shadow-card)]"
              aria-label={balanceVisible ? "Hide balance" : "Show balance"}
            >
              {balanceVisible ? <Eye size={18} strokeWidth={1.75} /> : <EyeOff size={18} strokeWidth={1.75} />}
            </button>
          </div>
        ) : (
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--ev-mint-100)] text-sm font-bold text-[var(--ev-primary)]"
            aria-hidden
          >
            {avatarInitial || "D"}
          </div>
        )}
      </div>
    </header>
  );
}
