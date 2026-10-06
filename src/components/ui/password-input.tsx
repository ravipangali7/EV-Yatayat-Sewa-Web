import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  leftIcon?: React.ReactNode;
}

const canMaskPasswordText =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  (CSS.supports("(-webkit-text-security: disc)") || CSS.supports("(text-security: disc)"));

function fieldKeyWithoutPassword(value?: string) {
  if (!value || !/pass|pwd/i.test(value)) return value;
  return value.replace(/pass(word)?|pwd/gi, "secret");
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, leftIcon, name, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const hideCharacters = !showPassword && canMaskPasswordText;
    const safeName = fieldKeyWithoutPassword(name);
    const safeId = fieldKeyWithoutPassword(id);

    return (
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">
            {leftIcon}
          </span>
        )}
        <Input
          {...props}
          id={safeId}
          name={safeName}
          type={hideCharacters || showPassword ? "text" : "password"}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-autocomplete="none"
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          className={cn(
            leftIcon && "pl-10",
            "pr-10",
            hideCharacters && "password-mask",
            className,
          )}
          ref={ref}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
