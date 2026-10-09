import { Link } from "react-router-dom";
import { Bell, Briefcase, ChevronRight, UserRound } from "lucide-react";
import { API_ORIGIN } from "@/lib/api";
import { LogoMark } from "@/components/brand/LogoMark";

function pictureSrc(src?: string | null) {
  if (!src) return undefined;
  return src.startsWith("http") ? src : `${API_ORIGIN}${src}`;
}

function money(value: number) {
  return `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function HomeHeader({
  name,
  tagline = "Travel smart. Travel green.",
  balance,
  balanceLoading,
  walletPath,
  profilePath,
  profilePicture,
  avatarInitial,
}: {
  name: string;
  tagline?: string;
  balance?: number;
  balanceLoading?: boolean;
  balanceVisible?: boolean;
  onToggleBalance?: () => void;
  walletPath?: string;
  profilePath?: string;
  profilePicture?: string | null;
  avatarInitial?: string;
}) {
  const showBalance = walletPath != null;

  return (
    <header className="px-5 pt-[max(0.875rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <LogoMark size={40} className="shrink-0" />
          <div className="min-w-0 leading-tight">
            <p className="ev-wordmark truncate text-[17px] font-bold text-[var(--ev-primary)]">EV Yatayat</p>
            <p className="truncate text-[11px] font-medium text-[var(--ev-primary)]/80">Go Electric. Go Smarter.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showBalance && (
            <span
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--ev-border)] bg-[var(--ev-surface)] text-[var(--ev-text)] shadow-[var(--ev-shadow-card)]"
              aria-hidden
            >
              <Bell size={18} strokeWidth={1.75} />
            </span>
          )}
          {profilePath ? (
            <Link
              to={profilePath}
              className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-[var(--ev-border)] bg-[var(--ev-mint-100)] text-[var(--ev-primary)] shadow-[var(--ev-shadow-card)]"
              aria-label="Profile"
            >
              {pictureSrc(profilePicture) ? (
                <img src={pictureSrc(profilePicture)} alt="" className="h-full w-full object-cover" />
              ) : avatarInitial ? (
                <span className="text-sm font-bold">{avatarInitial}</span>
              ) : (
                <UserRound size={18} strokeWidth={1.75} />
              )}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[26px] font-bold leading-none tracking-tight text-[var(--ev-text)]">{name},</p>
          <p className="mt-1.5 text-[13px] font-medium text-[var(--ev-text-muted)]">{tagline}</p>
        </div>

        {showBalance && (
          <Link
            to={walletPath}
            className="flex h-[62px] min-w-[158px] max-w-[52%] shrink-0 items-center gap-2 rounded-2xl bg-[var(--ev-wallet)] px-2.5 text-white shadow-[var(--ev-shadow-btn)]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20">
              <Briefcase size={16} strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-medium leading-none text-white/85">Balance</span>
              <span className="mt-1 block truncate text-[15px] font-bold leading-none tabular-nums">
                {balanceLoading ? (
                  <span className="inline-block h-4 w-20 animate-pulse rounded bg-white/30" />
                ) : (
                  money(Number(balance ?? 0))
                )}
              </span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-white/80" />
          </Link>
        )}
      </div>
    </header>
  );
}
