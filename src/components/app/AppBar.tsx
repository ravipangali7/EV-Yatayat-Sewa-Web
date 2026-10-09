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
        "sticky top-0 z-40 flex h-14 items-center justify-between px-5 " +
        (green
          ? "bg-[var(--ev-primary)] text-white "
          : "border-b border-[var(--ev-border)] bg-[var(--ev-surface)] text-[var(--ev-text)] ") +
        className
      }
    >
      <div className="flex min-w-0 items-center gap-2">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className={`-ml-1 shrink-0 rounded-lg p-2 ${green ? "text-white hover:bg-white/15" : "text-[var(--ev-text)] hover:bg-[var(--ev-mint-50)]"}`}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
        )}
        <h1 className="ev-wordmark truncate text-lg font-semibold">{title}</h1>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
