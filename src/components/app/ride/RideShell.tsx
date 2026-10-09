import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function RideShell({
  children,
  hills = true,
  className,
}: {
  children: ReactNode;
  hills?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("ride-shell relative min-h-screen", className)}>
      <div className="relative z-10">{children}</div>
      {hills && (
        <img
          src="/icons/hills.svg"
          alt=""
          className="pointer-events-none absolute bottom-0 left-0 z-0 h-36 w-full"
        />
      )}
    </div>
  );
}
