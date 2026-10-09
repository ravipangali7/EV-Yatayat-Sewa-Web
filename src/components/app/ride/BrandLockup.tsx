import { LogoMark } from "@/components/brand/LogoMark";
import { cn } from "@/lib/utils";

export function BrandLockup({
  size = "md",
  layout = "stack",
  className,
}: {
  size?: "md" | "sm";
  layout?: "stack" | "row";
  className?: string;
}) {
  const compact = size === "sm" || layout === "row";
  return (
    <div className={cn(layout === "row" ? "flex items-center gap-2.5 text-left" : "flex flex-col items-center text-center", className)}>
      <LogoMark size={compact ? 32 : 72} />
      <div>
        <h1 className={cn("ev-wordmark font-bold tracking-tight text-[var(--ev-primary)]", compact ? "text-base leading-tight" : "mt-2 text-[28px] leading-none")}>
          EV Yatayat
        </h1>
        <p className={cn("font-medium text-[var(--ev-primary-dark)]", compact ? "text-[11px]" : "mt-1 text-[13px]")}>
          Go Electric. Go Smarter.
        </p>
      </div>
    </div>
  );
}
