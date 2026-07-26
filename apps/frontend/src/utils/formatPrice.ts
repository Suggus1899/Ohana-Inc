/**
 * Format USD amount with VES equivalent for dual pricing display.
 */

export type RateType = 'oficial' | 'paralelo';

export const RATE_LABELS: Record<RateType, string> = {
  oficial: 'BCV / Oficial',
  paralelo: 'Paralelo',
};

export const RATE_COLORS: Record<RateType, string> = {
  oficial: 'text-blue-600 dark:text-blue-400',
  paralelo: 'text-green-600 dark:text-green-400',
};

export interface SingleRate {
  usdToVes: number;
  lastUpdated: string;
  source: string;
}

export interface ExchangeRateData {
  usdToVes: number;
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
          usdToVes: json.data.usdToVes,
          lastUpdated: json.data.lastUpdated,
          source: json.data.source,
          defaultRate: json.data.defaultRate || 'paralelo',
          rates: json.data.rates || { paralelo: { usdToVes: json.data.usdToVes, lastUpdated: json.data.lastUpdated, source: json.data.source } },
        };
        rateCache = { data, timestamp: Date.now() };
        return data;
      }
    } catch (e) {
      console.warn('Error fetching exchange rate:', e);
    }
    // Fallback: use cached if available, even if stale
    if (rateCache) return rateCache.data;
    const fallback: SingleRate = { usdToVes: 0, lastUpdated: '', source: 'fallback' };
    return { usdToVes: 0, lastUpdated: '', source: 'fallback', defaultRate: 'paralelo', rates: { paralelo: fallback } };
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
  const type = rateType || 'paralelo';
  return rates[type] || rates.paralelo || null;
}

/**
 * Get the VES value for a USD amount using a specific rate type.
 */
export function convertAtRate(
  usdAmount: number,
  rates: Record<RateType, SingleRate> | undefined,
  rateType?: RateType,
): { ves: number; rate: number } {
  const rate = getRate(rates, rateType);
  if (!rate || rate.usdToVes === 0) return { ves: 0, rate: 0 };
  return {
    ves: Math.round(usdAmount * rate.usdToVes * 100) / 100,
    rate: rate.usdToVes,
  };
}

/**
 * Format a number as currency with locale formatting.
 */
export function formatCurrency(amount: number, currency: 'USD' | 'VES'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Convert USD to VES at the given rate.
 */
export function usdToVes(usdAmount: number, rate: number): number {
  return Math.round(usdAmount * rate * 100) / 100;
}

/**
 * Format a price string with dual USD and VES amounts.
 */
export function formatDualPrice(usdAmount: number, vesAmount: number, period?: string): string {
  const usdStr = formatCurrency(usdAmount, 'USD');
  const vesStr = formatCurrency(vesAmount, 'VES');
  const periodStr = period ? `/${period}` : '';
  return `${usdStr}${periodStr} / ${vesStr}`;
}

/**
 * Short dual price format for cards.
 */
export function formatDualPriceShort(usdAmount: number, vesAmount: number, period?: string): string {
  const usdStr = `$${Math.round(usdAmount).toLocaleString('en-US')}`;
  const periodStr = period ? `/${period}` : '';

  let vesStr: string;
  if (vesAmount >= 1_000_000) {
    vesStr = `Bs. ${(vesAmount / 1_000_000).toFixed(1)}M`;
  } else if (vesAmount >= 1_000) {
    vesStr = `Bs. ${(vesAmount / 1_000).toFixed(0)}K`;
  } else {
    vesStr = `Bs. ${Math.round(vesAmount).toLocaleString('es-VE')}`;
  }

  return `${usdStr}${periodStr} ${vesStr}`;
}

/**
 * Full dual price label for component rendering.
 */
export function dualPriceLabel(usdAmount: number, vesAmount: number): { usd: string; ves: string } {
  return {
    usd: formatCurrency(usdAmount, 'USD'),
    ves: formatCurrency(vesAmount, 'VES'),
  };
}
