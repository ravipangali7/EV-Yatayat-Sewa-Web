/**
 * Unified icon source: Lucide, Material Icons, and Font Awesome.
 * Stored value format: "lucide:Bus" | "material:directions_bus" | "fa:bus"
 * Backward compat: plain "Bus" is treated as Lucide.
 */

import { MATERIAL_ICON_NAMES } from "./materialIconNames";
import { FA_ICON_NAMES } from "./faIconNames";

export type IconLibrary = "lucide" | "material" | "fa";

export interface IconEntry {
  id: string;
  library: IconLibrary;
  name: string;
  searchLabel: string;
}

/** Lucide icons (curated for suggestion / backward compat) */
const LUCIDE_LIST = [
  "Bus", "MapPin", "Users", "Leaf", "Building2", "Mountain", "CalendarCheck",
  "Plane", "GraduationCap", "Zap", "Battery", "Star", "Mail", "Phone", "Target",
  "Eye", "ArrowRight", "ChevronRight", "Quote",
] as const;

const lucideEntries: IconEntry[] = LUCIDE_LIST.map((name) => ({
  id: `lucide:${name}`,
  library: "lucide",
  name,
  searchLabel: name,
}));

/** Full Material Icons list (MaterialIcons-Regular) */
const materialEntries: IconEntry[] = MATERIAL_ICON_NAMES.map((name) => ({
  id: `material:${name}`,
  library: "material",
  name,
  searchLabel: name.replace(/_/g, " "),
}));

/** Full Font Awesome 6 Free Solid list */
const faEntries: IconEntry[] = FA_ICON_NAMES.map((name) => ({
  id: `fa:${name}`,
  library: "fa",
  name,
  searchLabel: name.replace(/-/g, " "),
}));

/** Build Lucide entries from icon names (e.g. from package keys). Used by IconPicker for full list. */
export function buildLucideEntries(names: string[]): IconEntry[] {
  return names.map((name) => ({
    id: `lucide:${name}`,
    library: "lucide" as const,
    name,
    searchLabel: name,
  }));
}

/** By library for tabbed picker (Material and FA are full sets) */
export const LUCIDE_ICONS: IconEntry[] = lucideEntries;
export const MATERIAL_ICONS: IconEntry[] = materialEntries;
export const FA_ICONS: IconEntry[] = faEntries;

/** Build full icon list for picker: pass Lucide icon names from the package. */
export function buildAllIcons(lucideNames: string[]): IconEntry[] {
  return [...buildLucideEntries(lucideNames), ...MATERIAL_ICONS, ...FA_ICONS];
}

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
