import { useState } from "react";
import { useExchangeRate } from "../../contexts/ExchangeRateContext";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { RefreshCw, Clock, Database, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { type RateType, RATE_LABELS, RATE_COLORS } from "../../utils/formatPrice";

function formatLastUpdated(dateStr?: string): string {
  if (!dateStr) return "No disponible";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function RatePopoverContent({
  rate,
  loading,
  onRefresh,
}: {
  rate: { usdToVes: number; lastUpdated?: string; source?: string; rates?: Record<string, { usdToVes: number; lastUpdated?: string; source?: string }> } | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const entries = rate?.rates
    ? (Object.entries(rate.rates) as [RateType, { usdToVes: number; lastUpdated?: string; source?: string }][])
    : [];

  return (
    <div className="w-72 space-y-3">
      <div className="flex items-center gap-2 border-b pb-2">
        <span className="text-lg">🇻🇪</span>
        <span className="font-semibold text-sm">Tasas de cambio</span>
      </div>

      {loading ? (
        <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">
          Cargando tasas...
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map(([type, rateEntry]) => (
            <div key={type} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium ${RATE_COLORS[type as RateType] || 'text-muted-foreground'}`}>
                    {RATE_LABELS[type as RateType] || type}
                  </span>
                </div>
                <span className="text-sm font-bold">
                  {rateEntry.usdToVes.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-muted-foreground font-normal">Bs</span>
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Database className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{rateEntry.source || "No disponible"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : rate ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">1 USD</span>
            <span className="text-base font-bold">
              {rate.usdToVes.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-muted-foreground font-normal">Bs</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="h-3 w-3 shrink-0" />
            <span className="truncate">{rate.source || "No disponible"}</span>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No disponible
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t pt-2">
        <Clock className="h-2.5 w-2.5 shrink-0" />
        <span>Actualizado: {formatLastUpdated(rate?.lastUpdated)}</span>
      </div>

      <div className="pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs gap-1.5 h-7"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Actualizar tasas
        </Button>
      </div>
    </div>
  );
}

export function ExchangeRateBadge() {
  const { rate, loading, error, refresh } = useExchangeRate();
  const [open, setOpen] = useState(false);

  if (loading || error || !rate || rate.usdToVes === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors cursor-pointer whitespace-nowrap">
          <span className="text-[10px]">🇻🇪</span>
          <span className="font-semibold">
            {rate.usdToVes.toLocaleString("es-VE", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{" "}
            Bs
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-fit">
        <RatePopoverContent rate={{ ...rate, rates: rate.rates }} loading={loading} onRefresh={refresh} />
      </PopoverContent>
    </Popover>
  );
}

export function ExchangeRateBadgeMobile() {
  const { rate, loading, error, refresh } = useExchangeRate();
  const [open, setOpen] = useState(false);

  if (loading || error || !rate || rate.usdToVes === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex md:hidden items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-xs font-medium text-green-700 dark:text-green-400 cursor-pointer">
          <span>🇻🇪</span>
          <span className="font-semibold">
            {rate.usdToVes.toLocaleString("es-VE", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{" "}
            Bs
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={8} className="w-fit">
        <RatePopoverContent rate={{ ...rate, rates: rate.rates }} loading={loading} onRefresh={refresh} />
      </PopoverContent>
    </Popover>
  );
}
