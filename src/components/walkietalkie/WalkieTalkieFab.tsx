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
      className="ev-fab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ev-primary)] focus-visible:ring-offset-2"
      aria-label="Open Walkie-Talkie"
    >
      <span className="relative flex items-center justify-center">
        <Radio className="h-6 w-6" strokeWidth={1.75} />
        {isLive && (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-[var(--ev-primary)]" aria-hidden />
        )}
      </span>
    </button>
  );
}
