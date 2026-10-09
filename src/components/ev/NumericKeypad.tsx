import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

/** Touch-only keypad. Native keyboard is used on fine pointers. */
export function NumericKeypad({
  onKey,
}: {
  onKey: (key: string) => void;
}) {
  return (
    <div className="ev-keypad mt-4 grid grid-cols-3 gap-2 rounded-2xl p-3 [@media(pointer:fine)]:hidden">
      {KEYS.map((key) => {
        if (key === "") return <span key="blank" />;
        const back = key === "back";
        return (
          <button
            key={key}
            type="button"
            className="flex h-[52px] items-center justify-center rounded-lg bg-[var(--ev-surface)] text-lg font-semibold text-[var(--ev-text)] shadow-sm"
            aria-label={back ? "Delete" : key}
            onClick={() => onKey(key)}
          >
            {back ? <Delete className="h-5 w-5" /> : key}
          </button>
        );
      })}
    </div>
  );
}
