import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_ICONS, type IconEntry } from "@/lib/websiteIcons";

type IconComponentType = React.ComponentType<{ className?: string }>;
const lucideRecord = LucideIcons as Record<string, IconComponentType>;

function renderIconForEntry(entry: IconEntry, className?: string) {
  if (entry.library === "lucide") {
    const Icon = lucideRecord[entry.name];
    return Icon ? <Icon className={cn("shrink-0", className)} /> : null;
  }
  if (entry.library === "material") {
    return (
      <span
        className={cn("material-icons shrink-0", className)}
        style={{ fontSize: "1rem" }}
        aria-hidden
      >
        {entry.name}
      </span>
    );
  }
  if (entry.library === "fa") {
    return <i className={cn(`fas fa-${entry.name}`, className)} aria-hidden />;
  }
  return null;
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

  const selectedEntry = ALL_ICONS.find(
    (e) => e.id === value || (e.library === "lucide" && e.name === value)
  );
  const suggestedEntry = suggestedIcon
    ? ALL_ICONS.find(
        (e) => e.id === suggestedIcon || (e.library === "lucide" && e.name === suggestedIcon)
      )
    : null;
  const showSuggestion =
    suggestedEntry &&
    suggestedIcon !== value &&
    onApplySuggestion;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-h-[320px] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput placeholder="Search Lucide, Material, Font Awesome..." />
          {showSuggestion && suggestedEntry && (
            <div className="border-b px-2 py-2 flex items-center justify-between gap-2 bg-muted/50">
              <span className="text-xs text-muted-foreground">
                Suggested for this name:
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 h-7 text-xs"
                onClick={() => {
                  onApplySuggestion();
                  setOpen(false);
                }}
              >
                {renderIconForEntry(suggestedEntry, "h-3 w-3 mr-1")}
                Use {suggestedEntry.searchLabel || suggestedEntry.name}
              </Button>
            </div>
          )}
          <CommandList>
            <CommandEmpty>No icon found.</CommandEmpty>
            <CommandGroup heading="All icons (Lucide, Material, Font Awesome)">
              {ALL_ICONS.map((entry) => (
                <CommandItem
                  key={entry.id}
                  value={`${entry.searchLabel} ${entry.id} ${entry.name} ${entry.library}`}
                  onSelect={() => {
                    onChange(entry.id);
                    setOpen(false);
                  }}
                >
                  {renderIconForEntry(entry, "mr-2 h-4 w-4 opacity-70")}
                  <span>
                    {entry.library}: {entry.searchLabel || entry.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
