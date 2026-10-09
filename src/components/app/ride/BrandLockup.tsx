import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export function BrandLockup({
  size = "md",
  className,
}: {
  size?: "md" | "sm";
  className?: string;
}) {
  const compact = size === "sm";
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <img
        src={logo}
        alt="EV Yatayat"
        className={cn("object-contain", compact ? "h-14 w-14" : "h-[72px] w-[72px]")}
      />
      <h1 className={cn("font-extrabold tracking-tight text-[#163024]", compact ? "mt-1 text-xl" : "mt-2 text-[26px]")}>
        EV Yatayat
      </h1>
      <p className="text-sm font-semibold text-[#1C8C42]">Go Electric. Go Smarter.</p>
    </div>
  );
}
