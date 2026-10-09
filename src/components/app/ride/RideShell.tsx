import { ReactNode } from "react";
import { HillsFooter } from "@/components/illustrations/HillsFooter";
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
    <div className={cn("ride-shell relative min-h-dvh overflow-hidden", className)}>
      <div className="relative z-10">{children}</div>
      {hills && <HillsFooter />}
    </div>
  );
}
