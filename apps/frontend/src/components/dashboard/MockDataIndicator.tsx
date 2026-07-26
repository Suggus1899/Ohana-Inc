import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MockDataIndicatorProps {
  message?: string;
  variant?: "banner" | "badge" | "inline";
  className?: string;
}

const MockDataIndicator = ({
  message = "Datos de demostración - Esta sección está en desarrollo.",
  variant = "banner",
  className,
}: MockDataIndicatorProps) => {
  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
          className
        )}
      >
        <AlertCircle className="h-3 w-3" />
        Datos de demostración
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground",
          className
        )}
      >
        <AlertCircle className="h-3 w-3" />
        Datos de demostración
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg mb-4",
        "bg-amber-50 border border-amber-200 text-amber-800",
        "dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default MockDataIndicator;
