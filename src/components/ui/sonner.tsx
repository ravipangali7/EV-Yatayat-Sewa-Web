import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[var(--ev-text)] group-[.toaster]:border group-[.toaster]:border-[var(--ev-border)] group-[.toaster]:rounded-xl group-[.toaster]:shadow-[var(--ev-shadow-card)] group-[.toaster]:border-l-4 group-[.toaster]:border-l-[var(--ev-primary)]",
          description: "group-[.toast]:text-[var(--ev-text-muted)]",
          success: "group-[.toaster]:border-l-[var(--ev-primary)]",
          error: "group-[.toaster]:border-l-[var(--ev-danger)]",
          info: "group-[.toaster]:border-l-[var(--ev-info)]",
          actionButton: "group-[.toast]:bg-[var(--ev-primary)] group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-[var(--ev-mint-50)] group-[.toast]:text-[var(--ev-text)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
