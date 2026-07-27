import { cn } from "@/lib/utils";

/**
 * Ohana brand logo.
 *
 * A stylized "O" enclosing a house silhouette — represents "family/home"
 * (Ohana in Hawaiian). Uses `currentColor` so it inherits the text color
 * (primary naranja by default).
 */
export function Logo({
  className,
  markClassName,
  showWordmark = true,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className={cn("h-7 w-7 text-primary", markClassName)}
      >
        {/* "O" ring */}
        <circle
          cx="16"
          cy="16"
          r="12.5"
          stroke="currentColor"
          strokeWidth="3"
        />
        {/* House roof + body inside the O */}
        <path
          d="M10.5 18.5 L16 13 L21.5 18.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.5 18.5 V22 H19.5 V18.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark && (
        <span
          className={cn(
            "text-lg font-bold tracking-tight text-primary",
            wordmarkClassName,
          )}
        >
          Ohana
        </span>
      )}
    </span>
  );
}
