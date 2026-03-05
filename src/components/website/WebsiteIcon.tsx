import * as LucideIcons from "lucide-react";
import { parseIconValue } from "@/lib/websiteIcons";
import { cn } from "@/lib/utils";

type IconComponentType = React.ComponentType<{ className?: string }>;
const lucideRecord = LucideIcons as Record<string, IconComponentType>;

/** Map Tailwind size classes to font-size so Material/FA match Lucide visually */
function getIconFontSize(className?: string): string {
  if (!className) return "1.25rem";
  if (/\bh-4\b/.test(className) || /\bw-4\b/.test(className)) return "1rem";
  if (/\bh-6\b/.test(className) || /\bw-6\b/.test(className)) return "1.5rem";
  if (/\bh-8\b/.test(className) || /\bw-8\b/.test(className)) return "2rem";
  if (/\bh-10\b/.test(className) || /\bw-10\b/.test(className)) return "2.5rem";
  if (/\bh-12\b/.test(className) || /\bw-12\b/.test(className)) return "3rem";
  return "1.25rem";
}

export interface WebsiteIconProps {
  /** Stored value: "lucide:Bus" | "material:directions_bus" | "fa:bus" or legacy "Bus" */
  name: string | null | undefined;
  className?: string;
}

/**
 * Renders an icon from stored value (Lucide, Material Icons, or Font Awesome).
 * All icon types are forced to the same visual size via the given className (e.g. h-8 w-8).
 */
export function WebsiteIcon({ name, className }: WebsiteIconProps) {
  const parsed = parseIconValue(name);
  if (!parsed) return null;

  const sizeStyle = { fontSize: getIconFontSize(className) };

  if (parsed.library === "lucide") {
    const Icon = lucideRecord[parsed.name];
    if (!Icon) return null;
    return <Icon className={cn("shrink-0", className)} />;
  }

  if (parsed.library === "material") {
    return (
      <span
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={sizeStyle}
        aria-hidden
      >
        <span className="material-icons" style={{ fontSize: "1em" }}>
          {parsed.name}
        </span>
      </span>
    );
  }

  if (parsed.library === "fa") {
    return (
      <span
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={sizeStyle}
        aria-hidden
      >
        <i className={cn(`fas fa-${parsed.name}`)} style={{ fontSize: "1em" }} />
      </span>
    );
  }

  return null;
}
