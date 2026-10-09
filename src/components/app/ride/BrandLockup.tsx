import logo from "@/assets/logo.png";
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
    <div className={cn(layout === "row" ? "flex items-center gap-3 text-left" : "flex flex-col items-center text-center", className)}>
      <img
        src={logo}
        alt="EV Yatayat"
        className={cn("object-contain", compact ? "h-12 w-12" : "h-[72px] w-[72px]")}
      />
      <div>
        <h1 className={cn("font-extrabold tracking-tight text-[#163024]", compact ? "text-xl" : "mt-2 text-[26px]")}>
          EV Yatayat
        </h1>
        <p className="text-sm font-semibold text-[#1C8C42]">Go Electric. Go Smarter.</p>
      </div>
    </div>
  );
}
