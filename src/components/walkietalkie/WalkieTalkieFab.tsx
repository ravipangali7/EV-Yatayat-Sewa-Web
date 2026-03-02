import { Radio } from "lucide-react";
import { useWalkieTalkie } from "@/contexts/WalkieTalkieContext";

export function WalkieTalkieFab() {
  const { openDrawer, status, drawerOpen } = useWalkieTalkie();
  const isLive = status === "connected";

  if (drawerOpen) return null;

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="fixed bottom-20 right-6 z-[9999] flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background active:scale-100"
      aria-label="Open Walkie-Talkie"
    >
      <span className="relative flex items-center justify-center">
        <Radio className="h-8 w-8" />
        {isLive && (
          <span
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse"
            aria-hidden
          />
        )}
      </span>
    </button>
  );
}
