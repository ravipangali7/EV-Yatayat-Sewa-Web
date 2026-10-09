import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SvgIcon } from "@/components/app/ride/SvgIcon";

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
        "sticky top-0 z-40 flex items-center justify-between px-4 py-3 " +
        (green
          ? "bg-[#1C8C42] text-white shadow-sm "
          : "backdrop-blur-xl bg-white dark:bg-card border-b border-[#E4EEE8] text-foreground shadow-sm ") +
        className
      }
    >
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className={`p-1.5 -ml-1 rounded-lg transition-colors shrink-0 ${green ? "hover:bg-white/15 text-white" : "hover:bg-muted text-foreground"}`}
            aria-label="Back"
          >
            <SvgIcon name="chevron-left" className="h-6 w-6" />
          </button>
        )}
        <h1 className="text-lg font-bold truncate">{title}</h1>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
