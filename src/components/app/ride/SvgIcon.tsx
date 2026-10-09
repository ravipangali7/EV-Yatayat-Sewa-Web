import { cn } from "@/lib/utils";

/** Renders a downloaded SVG from /icons using a CSS mask so the color can change. */
export function SvgIcon({ name, className }: { name: string; className?: string }) {
  const url = `/icons/${name}.svg`;
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
