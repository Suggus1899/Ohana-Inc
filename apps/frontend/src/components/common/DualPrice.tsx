import { usdToCop, formatCurrency } from "../../utils/formatPrice";

interface DualPriceProps {
  usd: number;
  copRate?: number;
  copAmount?: number;
  period?: string;
  variant?: "card" | "detail" | "inline";
  className?: string;
}

function formatCopShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return Math.round(amount).toLocaleString("es-VE");
}

/**
 * Dual price display component.
 * - "card": stacked layout (USD prominent, COP subtle) — for image overlays and compact cards
 * - "detail": side-by-side with separator — for detail views
 * - "inline": single line with spacing — for tables and lists
 */
export function DualPrice({
  usd,
  copRate,
  copAmount,
  period,
  variant = "card",
  className = "",
}: DualPriceProps) {
  const cop = copAmount ?? (copRate ? usdToCop(usd, copRate) : 0);
  const periodStr = period ? `/${period}` : "";

  if (variant === "detail") {
    return (
      <span className={`inline-flex items-baseline gap-2 ${className}`}>
        <span className="font-bold">
          {formatCurrency(usd, "USD")}
          {periodStr}
        </span>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-muted-foreground">
          ${" "}
          {cop.toLocaleString("es-VE", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </span>
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-baseline gap-2 ${className}`}>
        <span className="font-semibold">
          ${Math.round(usd).toLocaleString("en-US")}
          {periodStr}
        </span>
        <span className="text-xs text-muted-foreground/70">•</span>
        <span className="text-xs text-muted-foreground">
          $ {formatCopShort(cop)}
        </span>
      </span>
    );
  }

  // card variant — stacked
  return (
    <div className={`flex flex-col leading-tight ${className}`}>
      <span className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
        ${Math.round(usd).toLocaleString("en-US")}
        {periodStr}
      </span>
      <span className="text-[11px] sm:text-xs font-medium text-white/80 drop-shadow">
        $ {formatCopShort(cop)}
      </span>
    </div>
  );
}
