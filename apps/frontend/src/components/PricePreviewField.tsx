import { useExchangeRate } from "../contexts/ExchangeRateContext";
import { formatCurrency, usdToVes, type RateType } from "../utils/formatPrice";

interface PricePreviewFieldProps {
  value?: string | number;
  className?: string;
  rateType?: RateType;
}

export function PricePreviewField({ value, className = "", rateType }: PricePreviewFieldProps) {
  const { rate, loading, getVesFor } = useExchangeRate();

  if (!value || isNaN(Number(value)) || Number(value) <= 0) {
    return null;
  }

  const usd = Number(value);
  const ves = getVesFor(usd, rateType);

  if (loading || ves === 0) return null;

  return (
    <p className={`text-xs text-muted-foreground mt-1 ${className}`}>
      ≈ {formatCurrency(usd, "USD")} / <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(ves, "VES")}</span>
    </p>
  );
}

export function DualPriceDisplay({ usdAmount, className = "", rateType }: { usdAmount: number; className?: string; rateType?: RateType }) {
  const { rate, loading, getVesFor } = useExchangeRate();

  if (!rate || loading) {
    return <span className={className}>{formatCurrency(usdAmount, "USD")}</span>;
  }

  const ves = getVesFor(usdAmount, rateType);

  return (
    <span className={className}>
      <span>{formatCurrency(usdAmount, "USD")}</span>
      <span className="mx-1 text-muted-foreground">/</span>
      <span className="text-green-600 dark:text-green-400">{formatCurrency(ves, "VES")}</span>
    </span>
  );
}
