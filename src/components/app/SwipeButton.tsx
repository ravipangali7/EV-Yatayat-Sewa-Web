import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SwipeButtonProps {
  /** Single label (for non-bidirectional use) */
  label?: string;
  /** Right swipe (confirm) */
  onSwipe: () => void;
  /** Left swipe (cancel); when set, button is bidirectional */
  onCancel?: () => void;
  /** Label shown for right swipe (bidirectional) */
  labelRight?: string;
  /** Label shown for left swipe (bidirectional) */
  labelLeft?: string;
  variant?: "primary" | "destructive";
}

const SwipeButton = ({
  label,
  onSwipe,
  onCancel,
  labelRight = "Swipe right to confirm",
  labelLeft = "Swipe left to cancel",
  variant = "primary",
}: SwipeButtonProps) => {
  const [completed, setCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const isBidirectional = typeof onCancel === "function";
  const [trackWidth, setTrackWidth] = useState(300);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setTrackWidth(el.offsetWidth || 300);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const maxDrag = Math.max(48, trackWidth - 56);
  const threshold = maxDrag * 0.72;

  const bgOpacity = useTransform(x, [-threshold, 0, threshold], [0.5, 0.3, 1]);
  const textOpacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  const handleDragEnd = () => {
    const pos = x.get();
    if (pos > threshold) {
      setCompleted(true);
      onSwipe();
    } else if (isBidirectional && pos < -threshold) {
      onCancel?.();
    }
  };

  const hintText = isBidirectional ? `${labelLeft} · ${labelRight}` : label ?? "Swipe to confirm";

  return (
    <div
      ref={containerRef}
      className={`relative h-14 rounded-full overflow-hidden ${
        variant === "destructive" ? "bg-destructive/20" : "gradient-primary"
      }`}
      style={{ touchAction: "none" }}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: textOpacity }}
      >
        <span className="text-primary-foreground font-semibold text-sm tracking-wide text-center px-4">
          {hintText}
        </span>
      </motion.div>

      {!completed && (
        <motion.div
          drag="x"
          dragConstraints={isBidirectional ? { left: -maxDrag, right: maxDrag } : { left: 0, right: maxDrag }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ x, touchAction: "none" }}
          className={`absolute left-1 top-1 bottom-1 w-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 ${
            variant === "destructive" ? "bg-destructive" : "bg-primary-foreground"
          }`}
        >
          {isBidirectional ? (
            <>
              <ChevronLeft size={20} className={`absolute left-1 ${variant === "destructive" ? "text-destructive-foreground" : "text-primary"}`} />
              <ChevronRight size={20} className={`absolute right-1 ${variant === "destructive" ? "text-destructive-foreground" : "text-primary"}`} />
            </>
          ) : (
            <ChevronRight size={20} className={variant === "destructive" ? "text-destructive-foreground" : "text-primary"} />
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SwipeButton;
