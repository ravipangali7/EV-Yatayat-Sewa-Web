import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

/** Map-pin lockup. The shipped logo already matches the green ring + blue chevron mark. */
export function LogoMark({ size = 72, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logo}
      alt=""
      width={size}
      height={size}
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
