import { Button } from "@/components/ui/button";

interface MapTypeToggleProps {
  mapType: google.maps.MapTypeId;
  onToggle: () => void;
  className?: string;
}

export function MapTypeToggle({ mapType, onToggle, className = "" }: MapTypeToggleProps) {
  const label = mapType === "satellite" ? "Normal" : "Satellite";

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onToggle}
      className={`h-9 rounded-lg border border-border bg-background/90 px-3 text-xs shadow-sm backdrop-blur-sm hover:bg-muted ${className}`}
      title={`Switch to ${label.toLowerCase()} view`}
      aria-label={`Switch to ${label.toLowerCase()} view`}
    >
      {label}
    </Button>
  );
}
