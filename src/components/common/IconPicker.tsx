import { useState } from "react";
import * as Icons from "lucide-react";
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
import { WEBSITE_ICON_NAMES, type WebsiteIconName } from "@/lib/websiteIcons";

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

  const IconComponent = value && WEBSITE_ICON_NAMES.includes(value as WebsiteIconName)
    ? (Icons as Record<string, React.ComponentType<{ className?: string }>)[value]
    : null;

  const showSuggestion =
    suggestedIcon &&
    suggestedIcon !== value &&
    WEBSITE_ICON_NAMES.includes(suggestedIcon as WebsiteIconName) &&
    onApplySuggestion;

  const SuggestedIconComponent = showSuggestion
    ? (Icons as Record<string, React.ComponentType<{ className?: string }>)[suggestedIcon]
    : null;

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
            {IconComponent ? (
              <>
                <IconComponent className="h-4 w-4 shrink-0 opacity-70" />
                {value}
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search icons..." />
          {showSuggestion && SuggestedIconComponent && (
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
                <SuggestedIconComponent className="h-3 w-3 mr-1" />
                Use {suggestedIcon}
              </Button>
            </div>
          )}
          <CommandList>
            <CommandEmpty>No icon found.</CommandEmpty>
            <CommandGroup>
              {WEBSITE_ICON_NAMES.map((name) => {
                const Icon =
                  (Icons as Record<string, React.ComponentType<{ className?: string }>)[name];
                return (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                  >
                    {Icon ? (
                      <Icon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                    ) : null}
                    {name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
