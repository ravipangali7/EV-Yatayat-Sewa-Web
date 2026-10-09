import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface AppBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  className?: string;
  variant?: "default" | "green";
}

export default function AppBar({ title, showBack, onBack, right, className = "", variant = "default" }: AppBarProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));
  const green = variant === "green";

  return (
    <header
      className={
        "sticky top-0 z-40 border-b " +
        (green
          ? "border-transparent bg-[var(--ev-primary)] text-white "
          : "border-[var(--ev-border)] bg-[var(--ev-surface)]/95 text-[var(--ev-text)] backdrop-blur-md ") +
        className
      }
    >
      <div className="h-[env(safe-area-inset-top)]" />
      <div className="flex h-14 items-center gap-1 px-3">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              green ? "text-white hover:bg-white/15" : "text-[var(--ev-text)] hover:bg-[var(--ev-mint-50)]"
            }`}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : (
          <span className="w-2 shrink-0" aria-hidden />
        )}
        <h1 className="ev-wordmark min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight">{title}</h1>
        {right ? <div className="shrink-0 pr-2">{right}</div> : <span className="w-2 shrink-0" aria-hidden />}
      </div>
    </header>
  );
}
