/**
 * Format USD amount with COP equivalent for dual pricing display.
 */

export type RateType = 'trm';

export const RATE_LABELS: Record<RateType, string> = {
  trm: 'TRM',
};

export const RATE_COLORS: Record<RateType, string> = {
  trm: 'text-blue-600 dark:text-blue-400',
};

export interface SingleRate {
  usdToCop: number;
  lastUpdated: string;
  source: string;
}

export interface ExchangeRateData {
  usdToCop: number;
  lastUpdated: string;
  source: string;
  defaultRate: RateType;
  rates: Record<RateType, SingleRate>;
}

interface CacheEntry {
  data: ExchangeRateData;
  timestamp: number;
}

let rateCache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let pendingFetch: Promise<ExchangeRateData> | null = null;

/**
 * Fetch all exchange rates from the backend API.
 */
export async function fetchExchangeRate(): Promise<ExchangeRateData> {
  const now = Date.now();
  if (rateCache && now - rateCache.timestamp < CACHE_TTL) {
    return rateCache.data;
  }

  if (pendingFetch) return pendingFetch;

  pendingFetch = (async () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3026/api';
    try {
      const res = await fetch(`${baseUrl}/exchange-rate`);
      const json = await res.json();
      if (json.success && json.data) {
        const data: ExchangeRateData = {
          usdToCop: json.data.usdToCop,
          lastUpdated: json.data.lastUpdated,
          source: json.data.source,
          defaultRate: json.data.defaultRate || 'trm',
          rates: json.data.rates || { trm: { usdToCop: json.data.usdToCop, lastUpdated: json.data.lastUpdated, source: json.data.source } },
        };
        rateCache = { data, timestamp: Date.now() };
        return data;
      }
    } catch (e) {
      console.warn('Error fetching exchange rate:', e);
    }
    // Fallback: use cached if available, even if stale
    if (rateCache) return rateCache.data;
    const fallback: SingleRate = { usdToCop: 0, lastUpdated: '', source: 'fallback' };
    return { usdToCop: 0, lastUpdated: '', source: 'fallback', defaultRate: 'trm', rates: { trm: fallback } };
  })();

  try {
    return await pendingFetch;
  } finally {
    pendingFetch = null;
  }
}

/**
 * Get a single rate from the rates object by type.
 */
export function getRate(
  rates: Record<RateType, SingleRate> | undefined,
  rateType?: RateType,
): SingleRate | null {
  if (!rates) return null;
  const type = rateType || 'trm';
  return rates[type] || rates.trm || null;
}

/**
 * Get the COP value for a USD amount using a specific rate type.
 */
export function convertAtRate(
  usdAmount: number,
  rates: Record<RateType, SingleRate> | undefined,
  rateType?: RateType,
): { cop: number; rate: number } {
  const rate = getRate(rates, rateType);
  if (!rate || rate.usdToCop === 0) return { cop: 0, rate: 0 };
  return {
    cop: Math.round(usdAmount * rate.usdToCop * 100) / 100,
    rate: rate.usdToCop,
  };
}

/**
 * Format a number as currency with locale formatting.
 */
export function formatCurrency(amount: number, currency: 'USD' | 'COP'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Convert USD to COP at the given rate.
 */
export function usdToCop(usdAmount: number, rate: number): number {
  return Math.round(usdAmount * rate * 100) / 100;
}

/**
 * Format a price string with dual USD and COP amounts.
 */
export function formatDualPrice(usdAmount: number, copAmount: number, period?: string): string {
  const usdStr = formatCurrency(usdAmount, 'USD');
  const copStr = formatCurrency(copAmount, 'COP');
  const periodStr = period ? `/${period}` : '';
  return `${usdStr}${periodStr} / ${copStr}`;
}

/**
 * Short dual price format for cards.
 */
export function formatDualPriceShort(usdAmount: number, copAmount: number, period?: string): string {
  const usdStr = `$${Math.round(usdAmount).toLocaleString('en-US')}`;
  const periodStr = period ? `/${period}` : '';

  let copStr: string;
  if (copAmount >= 1_000_000) {
    copStr = `$${(copAmount / 1_000_000).toFixed(1)}M`;
  } else if (copAmount >= 1_000) {
    copStr = `$${(copAmount / 1_000).toFixed(0)}K`;
  } else {
    copStr = `$${Math.round(copAmount).toLocaleString('es-CO')}`;
  }

  return `${usdStr}${periodStr} ${copStr}`;
}

/**
 * Full dual price label for component rendering.
 */
export function dualPriceLabel(usdAmount: number, copAmount: number): { usd: string; cop: string } {
  return {
    usd: formatCurrency(usdAmount, 'USD'),
    cop: formatCurrency(copAmount, 'COP'),
  };
}
