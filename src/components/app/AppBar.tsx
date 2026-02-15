import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  className?: string;
}

export default function AppBar({ title, showBack, onBack, right, className = "" }: AppBarProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <header
      className={
        "sticky top-0 z-40 flex items-center justify-between px-4 py-3 " +
        "backdrop-blur-xl bg-primary/80 border-b border-primary-foreground/20 " +
        "text-primary-foreground " +
        className
      }
    >
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 -ml-1 rounded-lg hover:bg-primary-foreground/20 transition-colors shrink-0"
            aria-label="Back"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="text-lg font-bold truncate">{title}</h1>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
