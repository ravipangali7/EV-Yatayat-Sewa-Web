import * as LucideIcons from "lucide-react";
import { parseIconValue } from "@/lib/websiteIcons";
import { cn } from "@/lib/utils";

type IconComponentType = React.ComponentType<{ className?: string }>;
const lucideRecord = LucideIcons as Record<string, IconComponentType>;

export interface WebsiteIconProps {
  /** Stored value: "lucide:Bus" | "material:directions_bus" | "fa:bus" or legacy "Bus" */
  name: string | null | undefined;
  className?: string;
}

/**
 * Renders an icon from stored value (Lucide, Material Icons, or Font Awesome).
 */
export function WebsiteIcon({ name, className }: WebsiteIconProps) {
  const parsed = parseIconValue(name);
  if (!parsed) return null;

  if (parsed.library === "lucide") {
    const Icon = lucideRecord[parsed.name];
    if (!Icon) return null;
    return <Icon className={cn("shrink-0", className)} />;
  }

  if (parsed.library === "material") {
    return (
      <span
        className={cn("material-icons shrink-0", className)}
        style={{ fontSize: "inherit" }}
        aria-hidden
      >
        {parsed.name}
      </span>
    );
  }

  if (parsed.library === "fa") {
    return (
      <i
        className={cn(`fas fa-${parsed.name}`, className)}
        aria-hidden
      />
    );
  }

  return null;
}
