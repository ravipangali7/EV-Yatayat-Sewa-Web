import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLanguage, t } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-[var(--ev-border)] bg-[var(--ev-surface)] p-0.5 text-xs font-semibold",
        className,
      )}
      role="group"
      aria-label={t("lang.label")}
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={cn(
          "min-h-8 rounded-full px-2.5 py-1",
          lang === "en" ? "bg-[var(--ev-primary)] text-white" : "text-[var(--ev-text-muted)]",
        )}
        aria-pressed={lang === "en"}
      >
        {t("lang.en")}
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ne")}
        className={cn(
          "min-h-8 rounded-full px-2.5 py-1",
          lang === "ne" ? "bg-[var(--ev-primary)] text-white" : "text-[var(--ev-text-muted)]",
        )}
        aria-pressed={lang === "ne"}
      >
        {t("lang.ne")}
      </button>
    </div>
  );
}
