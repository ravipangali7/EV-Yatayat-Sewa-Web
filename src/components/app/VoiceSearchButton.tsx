import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { cn } from "@/lib/utils";

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
  const { listening, startListening, stopListening, supported } = useVoiceSearch({
    onResult: (t) => onResult(t.trim()),
    lang: "en-NP",
  });

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
