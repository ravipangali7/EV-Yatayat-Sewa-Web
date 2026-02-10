import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface SwipeButtonProps {
  label: string;
  onSwipe: () => void;
  variant?: "primary" | "destructive";
}

const SwipeButton = ({ label, onSwipe, variant = "primary" }: SwipeButtonProps) => {
  const [completed, setCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const bgOpacity = useTransform(x, [0, 200], [0.3, 1]);
  const textOpacity = useTransform(x, [0, 150], [1, 0]);

  const handleDragEnd = () => {
    const containerWidth = containerRef.current?.offsetWidth || 300;
    if (x.get() > containerWidth * 0.6) {
      setCompleted(true);
      onSwipe();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-14 rounded-full overflow-hidden ${
        variant === "destructive" ? "bg-destructive/20" : "gradient-primary"
      }`}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: textOpacity }}
      >
        <span className="text-primary-foreground font-semibold text-sm tracking-wide">
          {label}
        </span>
      </motion.div>

      {!completed && (
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={`absolute left-1 top-1 bottom-1 w-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing ${
            variant === "destructive" ? "bg-destructive" : "bg-primary-foreground"
          }`}
        >
          <ChevronRight
            size={20}
            className={variant === "destructive" ? "text-destructive-foreground" : "text-primary"}
          />
        </motion.div>
      )}
    </div>
  );
};

export default SwipeButton;
