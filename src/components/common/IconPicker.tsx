import { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildAllIcons,
  MATERIAL_ICONS,
  FA_ICONS,
  type IconEntry,
} from "@/lib/websiteIcons";

type IconComponentType = React.ComponentType<{ className?: string }>;
const lucideRecord = LucideIcons as unknown as Record<string, IconComponentType>;

const LUCIDE_NON_ICONS = new Set([
  "createLucideIcon", "ForwardRef", "default", "LucideIcon", "icons",
  "Icon", "LucideProps", "defaultProps",
]);

function getLucideIconNames(): string[] {
  return Object.keys(lucideRecord).filter(
    (k) =>
      /^[A-Z]/.test(k) &&
      typeof lucideRecord[k] === "function" &&
      !LUCIDE_NON_ICONS.has(k)
  );
}

const ALL_ICONS: IconEntry[] = buildAllIcons(getLucideIconNames());
const FULL_LUCIDE_ICONS: IconEntry[] = ALL_ICONS.filter((e) => e.library === "lucide");

const ICON_BOX_SIZE = "2.25rem"; // same for all libraries in the grid

function renderIconForEntry(entry: IconEntry, className?: string) {
  if (entry.library === "lucide") {
    const Icon = lucideRecord[entry.name];
    return Icon ? <Icon className={cn("shrink-0", className)} /> : null;
  }
  if (entry.library === "material") {
    return (
      <span
        className={cn("material-icons shrink-0", className)}
        style={{ fontSize: "1.25rem" }}
        aria-hidden
      >
        {entry.name}
      </span>
    );
  }
  if (entry.library === "fa") {
    return (
      <i
        className={cn("fas shrink-0", `fa-${entry.name}`, className)}
        style={{ fontSize: "1.25rem" }}
        aria-hidden
      />
    );
  }
  return null;
}

function filterIcons(icons: IconEntry[], query: string): IconEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return icons;
  return icons.filter(
    (e) =>
      e.searchLabel.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
  );
}

function IconGrid({
  icons,
  searchQuery,
  value,
  onSelect,
}: {
  icons: IconEntry[];
  searchQuery: string;
  value: string;
  onSelect: (id: string) => void;
}) {
  const filtered = useMemo(() => filterIcons(icons, searchQuery), [icons, searchQuery]);
  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-[320px] overflow-y-auto p-1">
      {filtered.length === 0 ? (
        <p className="col-span-full text-sm text-muted-foreground py-8 text-center">
          No icons match &quot;{searchQuery}&quot;
        </p>
      ) : (
        filtered.map((entry) => {
          const isSelected =
            value === entry.id || (entry.library === "lucide" && value === entry.name);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry.id)}
              className={cn(
                "flex items-center justify-center rounded-lg border transition-colors hover:bg-accent hover:text-accent-foreground",
                isSelected ? "border-primary bg-primary/10 text-primary" : "border-border"
              )}
              style={{ width: ICON_BOX_SIZE, height: ICON_BOX_SIZE, minWidth: ICON_BOX_SIZE, minHeight: ICON_BOX_SIZE }}
              title={`${entry.library}: ${entry.searchLabel || entry.name}`}
            >
              {renderIconForEntry(entry)}
            </button>
          );
        })
      )}
    </div>
  );
}

export interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
  suggestedIcon?: string | null;
  onApplySuggestion?: () => void;
  disabled?: boolean;
  className?: string;
}

export function IconPicker({
  value,
  onChange,
  placeholder = "Select icon...",
  suggestedIcon,
  onApplySuggestion,
  disabled = false,
  className,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedEntry = ALL_ICONS.find(
    (e) => e.id === value || (e.library === "lucide" && e.name === value)
  );
  const suggestedEntry = suggestedIcon
    ? ALL_ICONS.find(
        (e) => e.id === suggestedIcon || (e.library === "lucide" && e.name === suggestedIcon)
      )
    : null;
  const showSuggestion =
    suggestedEntry && suggestedIcon !== value && onApplySuggestion;

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedEntry ? (
              <>
                {renderIconForEntry(selectedEntry, "h-4 w-4 opacity-70")}
                <span className="truncate">
                  {selectedEntry.library}: {selectedEntry.searchLabel || selectedEntry.name}
                </span>
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose icon</DialogTitle>
        </DialogHeader>
        {showSuggestion && suggestedEntry && (
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3">
            <span className="text-sm text-muted-foreground">
              Suggested for this name:
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                onApplySuggestion();
                setOpen(false);
              }}
            >
              {renderIconForEntry(suggestedEntry, "h-4 w-4 mr-1.5")}
              Use {suggestedEntry.searchLabel || suggestedEntry.name}
            </Button>
          </div>
        )}
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="lucide">Lucide</TabsTrigger>
            <TabsTrigger value="material">Material</TabsTrigger>
            <TabsTrigger value="fa">Font Awesome</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-3 flex-1 min-h-0">
            <IconGrid
              icons={ALL_ICONS}
              searchQuery={search}
              value={value}
              onSelect={handleSelect}
            />
          </TabsContent>
          <TabsContent value="lucide" className="mt-3 flex-1 min-h-0">
            <IconGrid
              icons={FULL_LUCIDE_ICONS}
              searchQuery={search}
              value={value}
              onSelect={handleSelect}
            />
          </TabsContent>
          <TabsContent value="material" className="mt-3 flex-1 min-h-0">
            <IconGrid
              icons={MATERIAL_ICONS}
              searchQuery={search}
              value={value}
              onSelect={handleSelect}
            />
          </TabsContent>
          <TabsContent value="fa" className="mt-3 flex-1 min-h-0">
            <IconGrid
              icons={FA_ICONS}
              searchQuery={search}
              value={value}
              onSelect={handleSelect}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
