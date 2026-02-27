import { Radio } from "lucide-react";
import { useWalkieTalkie } from "@/contexts/WalkieTalkieContext";

export function WalkieTalkieFab() {
  const { openDrawer } = useWalkieTalkie();

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label="Open Walkie-Talkie"
    >
      <Radio className="h-7 w-7" />
    </button>
  );
}
