/**
 * Icon names allowed for website stats and services (Lucide React).
 * Keep in sync with iconMap usage on public pages.
 */
export const WEBSITE_ICON_NAMES = [
  "Bus",
  "MapPin",
  "Users",
  "Leaf",
  "Building2",
  "Mountain",
  "CalendarCheck",
  "Plane",
  "GraduationCap",
  "Zap",
  "Battery",
  "Star",
  "Mail",
  "Phone",
  "Target",
  "Eye",
  "ArrowRight",
  "ChevronRight",
  "Quote",
] as const;

export type WebsiteIconName = (typeof WEBSITE_ICON_NAMES)[number];

/** Keyword phrases (lowercase) -> icon name. First match wins. */
const KEYWORD_TO_ICON: { keywords: string[]; icon: WebsiteIconName }[] = [
  { keywords: ["bus", "transport", "city", "vehicle", "fleet", "route"], icon: "Bus" },
  { keywords: ["map", "route", "location", "address", "place", "destination", "covered"], icon: "MapPin" },
  { keywords: ["people", "team", "passenger", "users", "trained", "driver", "expert"], icon: "Users" },
  { keywords: ["green", "eco", "leaf", "emission", "sustainable", "zero"], icon: "Leaf" },
  { keywords: ["building", "corporate", "office", "shuttle"], icon: "Building2" },
  { keywords: ["mountain", "tour", "travel", "tourism"], icon: "Mountain" },
  { keywords: ["calendar", "charter", "schedule", "booking"], icon: "CalendarCheck" },
  { keywords: ["plane", "airport", "transfer", "flight"], icon: "Plane" },
  { keywords: ["school", "education", "student"], icon: "GraduationCap" },
  { keywords: ["electric", "charge", "power", "zap"], icon: "Zap" },
  { keywords: ["battery", "charging", "charging infra"], icon: "Battery" },
  { keywords: ["star", "rating", "review"], icon: "Star" },
  { keywords: ["mail", "email", "contact"], icon: "Mail" },
  { keywords: ["phone", "call", "contact"], icon: "Phone" },
  { keywords: ["mission", "target", "goal"], icon: "Target" },
  { keywords: ["vision", "eye", "future"], icon: "Eye" },
];

/**
 * Suggests an icon name based on text (e.g. label or service name).
 * Case-insensitive; returns first matching icon or null.
 */
export function suggestIconFromText(text: string): string | null {
  const lower = text.trim().toLowerCase();
  if (!lower) return null;
  for (const { keywords, icon } of KEYWORD_TO_ICON) {
    if (keywords.some((kw) => lower.includes(kw))) return icon;
  }
  return null;
}
