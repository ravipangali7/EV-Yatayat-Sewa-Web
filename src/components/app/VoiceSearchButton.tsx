import { useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { normalizeSearchInput } from "@/lib/transliterate";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline";
}

export function VoiceSearchButton({
  onResult,
  disabled = false,
  className,
  size = "default",
  variant = "ghost",
}: VoiceSearchButtonProps) {
  const { listening, startListening, stopListening, supported, error } = useVoiceSearch({
    onResult: (t) => onResult(normalizeSearchInput(t)),
    lang: "en-NP",
  });

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (!supported) return null;

  const handleClick = () => {
    if (listening) stopListening();
    else startListening();
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn("shrink-0", className)}
      onClick={handleClick}
      title={listening ? "Stop listening" : "Voice search"}
      aria-label={listening ? "Stop listening" : "Voice search"}
    >
      {listening ? (
        <MicOff className="h-4 w-4 text-destructive" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
