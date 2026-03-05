/**
 * Unified icon source: Lucide, Material Icons, and Font Awesome.
 * Stored value format: "lucide:Bus" | "material:directions_bus" | "fa:bus"
 * Backward compat: plain "Bus" is treated as Lucide.
 */

export type IconLibrary = "lucide" | "material" | "fa";

export interface IconEntry {
  id: string;
  library: IconLibrary;
  name: string;
  searchLabel: string;
}

/** Lucide icons (id = lucide:Name) */
const LUCIDE_LIST = [
  "Bus", "MapPin", "Users", "Leaf", "Building2", "Mountain", "CalendarCheck",
  "Plane", "GraduationCap", "Zap", "Battery", "Star", "Mail", "Phone", "Target",
  "Eye", "ArrowRight", "ChevronRight", "Quote",
] as const;

/** Material Icons (id = material:icon_name) */
const MATERIAL_LIST: { id: string; name: string; searchLabel: string }[] = [
  { id: "material:directions_bus", name: "directions_bus", searchLabel: "bus transport" },
  { id: "material:place", name: "place", searchLabel: "map location place" },
  { id: "material:people", name: "people", searchLabel: "users team people" },
  { id: "material:eco", name: "eco", searchLabel: "leaf green eco" },
  { id: "material:business", name: "business", searchLabel: "building office" },
  { id: "material:terrain", name: "terrain", searchLabel: "mountain terrain" },
  { id: "material:event_available", name: "event_available", searchLabel: "calendar check" },
  { id: "material:flight_takeoff", name: "flight_takeoff", searchLabel: "plane flight" },
  { id: "material:school", name: "school", searchLabel: "education school" },
  { id: "material:bolt", name: "bolt", searchLabel: "electric zap" },
  { id: "material:battery_charging_full", name: "battery_charging_full", searchLabel: "battery charging" },
  { id: "material:star", name: "star", searchLabel: "star rating" },
  { id: "material:mail", name: "mail", searchLabel: "mail email" },
  { id: "material:phone", name: "phone", searchLabel: "phone call" },
  { id: "material:gps_fixed", name: "gps_fixed", searchLabel: "target gps" },
  { id: "material:visibility", name: "visibility", searchLabel: "eye vision" },
  { id: "material:arrow_forward", name: "arrow_forward", searchLabel: "arrow right" },
  { id: "material:chevron_right", name: "chevron_right", searchLabel: "chevron" },
  { id: "material:format_quote", name: "format_quote", searchLabel: "quote" },
];

/** Font Awesome (id = fa:icon-name), class = fas fa-{name} */
const FA_LIST: { id: string; name: string; searchLabel: string }[] = [
  { id: "fa:bus", name: "bus", searchLabel: "bus transport" },
  { id: "fa:location-dot", name: "location-dot", searchLabel: "map location" },
  { id: "fa:users", name: "users", searchLabel: "users team" },
  { id: "fa:leaf", name: "leaf", searchLabel: "leaf green" },
  { id: "fa:building", name: "building", searchLabel: "building" },
  { id: "fa:mountain-sun", name: "mountain-sun", searchLabel: "mountain" },
  { id: "fa:calendar-check", name: "calendar-check", searchLabel: "calendar" },
  { id: "fa:plane", name: "plane", searchLabel: "plane flight" },
  { id: "fa:graduation-cap", name: "graduation-cap", searchLabel: "education" },
  { id: "fa:bolt", name: "bolt", searchLabel: "electric zap" },
  { id: "fa:battery-full", name: "battery-full", searchLabel: "battery" },
  { id: "fa:star", name: "star", searchLabel: "star" },
  { id: "fa:envelope", name: "envelope", searchLabel: "mail email" },
  { id: "fa:phone", name: "phone", searchLabel: "phone" },
  { id: "fa:bullseye", name: "bullseye", searchLabel: "target" },
  { id: "fa:eye", name: "eye", searchLabel: "eye vision" },
  { id: "fa:arrow-right", name: "arrow-right", searchLabel: "arrow" },
  { id: "fa:chevron-right", name: "chevron-right", searchLabel: "chevron" },
  { id: "fa:quote-left", name: "quote-left", searchLabel: "quote" },
];

const lucideEntries: IconEntry[] = LUCIDE_LIST.map((name) => ({
  id: `lucide:${name}`,
  library: "lucide",
  name,
  searchLabel: name,
}));

const materialEntries: IconEntry[] = MATERIAL_LIST.map(({ id, name, searchLabel }) => ({
  id,
  library: "material",
  name,
  searchLabel,
}));

const faEntries: IconEntry[] = FA_LIST.map(({ id, name, searchLabel }) => ({
  id,
  library: "fa",
  name,
  searchLabel,
}));

/** All icons for picker; searchable by searchLabel and name */
export const ALL_ICONS: IconEntry[] = [...lucideEntries, ...materialEntries, ...faEntries];

/** By library for tabbed picker */
export const LUCIDE_ICONS: IconEntry[] = lucideEntries;
export const MATERIAL_ICONS: IconEntry[] = materialEntries;
export const FA_ICONS: IconEntry[] = faEntries;

/** Lucide-only names (backward compat) */
export const WEBSITE_ICON_NAMES = LUCIDE_LIST;
export type WebsiteIconName = (typeof WEBSITE_ICON_NAMES)[number];

/** Parse stored value into library + name. Plain "Bus" → lucide Bus */
export function parseIconValue(value: string | null | undefined): { library: IconLibrary; name: string } | null {
  const v = (value ?? "").toString().trim();
  if (!v) return null;
  if (v.startsWith("material:")) return { library: "material", name: v.slice(9) };
  if (v.startsWith("fa:")) return { library: "fa", name: v.slice(3) };
  if (v.startsWith("lucide:")) return { library: "lucide", name: v.slice(7) };
  return { library: "lucide", name: v }; // backward compat: "Bus" → lucide Bus
}

/** Normalize stored value to full id (e.g. "Bus" → "lucide:Bus") */
export function toStoredIconId(value: string | null | undefined): string {
  const parsed = parseIconValue(value);
  if (!parsed) return "";
  return parsed.library === "lucide" && !value?.includes(":")
    ? `lucide:${parsed.name}`
    : parsed.library === "lucide"
      ? `lucide:${parsed.name}`
      : parsed.library === "material"
        ? `material:${parsed.name}`
        : `fa:${parsed.name}`;
}

const KEYWORD_TO_ICON_ID: { keywords: string[]; iconId: string }[] = [
  { keywords: ["bus", "transport", "city", "vehicle", "fleet", "route"], iconId: "lucide:Bus" },
  { keywords: ["map", "route", "location", "address", "place", "destination", "covered"], iconId: "lucide:MapPin" },
  { keywords: ["people", "team", "passenger", "users", "trained", "driver", "expert"], iconId: "lucide:Users" },
  { keywords: ["green", "eco", "leaf", "emission", "sustainable", "zero"], iconId: "lucide:Leaf" },
  { keywords: ["building", "corporate", "office", "shuttle"], iconId: "lucide:Building2" },
  { keywords: ["mountain", "tour", "travel", "tourism"], iconId: "lucide:Mountain" },
  { keywords: ["calendar", "charter", "schedule", "booking"], iconId: "lucide:CalendarCheck" },
  { keywords: ["plane", "airport", "transfer", "flight"], iconId: "lucide:Plane" },
  { keywords: ["school", "education", "student"], iconId: "lucide:GraduationCap" },
  { keywords: ["electric", "charge", "power", "zap"], iconId: "lucide:Zap" },
  { keywords: ["battery", "charging", "charging infra"], iconId: "lucide:Battery" },
  { keywords: ["star", "rating", "review"], iconId: "lucide:Star" },
  { keywords: ["mail", "email", "contact"], iconId: "lucide:Mail" },
  { keywords: ["phone", "call", "contact"], iconId: "lucide:Phone" },
  { keywords: ["mission", "target", "goal"], iconId: "lucide:Target" },
  { keywords: ["vision", "eye", "future"], iconId: "lucide:Eye" },
];

/**
 * Suggests an icon id (e.g. "lucide:Bus") from text. Case-insensitive; first match wins.
 */
export function suggestIconFromText(text: string): string | null {
  const lower = text.trim().toLowerCase();
  if (!lower) return null;
  for (const { keywords, iconId } of KEYWORD_TO_ICON_ID) {
    if (keywords.some((kw) => lower.includes(kw))) return iconId;
  }
  return null;
}
