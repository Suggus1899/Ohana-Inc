// Exchange rate service using open.er-api.com (USD -> COP)
// Caches the TRM (Tasa Representativa del Mercado) in memory with configurable TTL

export type RateType = 'trm';

export interface SingleRate {
  usdToCop: number;
  lastUpdated: Date;
  source: string;
}

export interface AllRates {
  rates: Record<RateType, SingleRate>;
  defaultRate: RateType;
}

interface ErApiResult {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}

class ExchangeRateService {
  private cachedRates: AllRates | null = null;
  private lastFetchTime = 0;
  private ttlMs = 5 * 60 * 1000; // 5 minutes
  private fetchPromise: Promise<AllRates> | null = null;

  constructor(ttlMinutes = 5) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  /**
   * Get all exchange rates.
   * Returns cached rates if still fresh, otherwise fetches from open.er-api.com.
   */
  async getAllRates(forceRefresh = false): Promise<AllRates> {
    const now = Date.now();

    if (!forceRefresh && this.cachedRates && (now - this.lastFetchTime) < this.ttlMs) {
      return this.cachedRates;
    }

    // Deduplicate concurrent fetches
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = this.fetchAllRates();
    try {
      const rates = await this.fetchPromise;
      this.cachedRates = rates;
      this.lastFetchTime = now;
      return rates;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Get a single rate by type.
   */
  async getRate(rateType: RateType = 'trm', forceRefresh = false): Promise<SingleRate> {
    const all = await this.getAllRates(forceRefresh);
    return all.rates[rateType];
  }

  /**
   * Convert USD to COP at the TRM rate.
   */
  async convertUsdToCop(usdAmount: number, rateType: RateType = 'trm'): Promise<number> {
    const rate = await this.getRate(rateType);
    return Math.round(usdAmount * rate.usdToCop * 100) / 100;
  }

  /**
   * Format USD amount with COP equivalent for display.
   */
  async formatDualPrice(usdAmount: number, rateType: RateType = 'trm'): Promise<{ usd: number; cop: number; rate: number }> {
    const rate = await this.getRate(rateType);
    const cop = Math.round(usdAmount * rate.usdToCop * 100) / 100;
    return { usd: usdAmount, cop, rate: rate.usdToCop };
  }

  /**
   * Force refresh all rates immediately.
   */
  async refresh(): Promise<AllRates> {
    return this.getAllRates(true);
  }

  /**
   * Clear cached rates (next getAllRates() will fetch fresh).
   */
  clearCache(): void {
    this.cachedRates = null;
    this.lastFetchTime = 0;
  }

  private async fetchAllRates(): Promise<AllRates> {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json() as ErApiResult;

      const copRate = data.rates?.COP;
      if (!copRate || copRate <= 0) {
        throw new Error('COP rate not found in response');
      }

      const lastUpdated = data.time_last_update_utc
        ? new Date(data.time_last_update_utc)
        : new Date();

      const trmRate: SingleRate = {
        usdToCop: copRate,
        lastUpdated,
        source: 'open.er-api.com (TRM)',
      };

      return {
        rates: { trm: trmRate },
        defaultRate: 'trm',
      };
    } catch (err) {
      throw new Error(`Error obteniendo TRM USD/COP: ${(err as Error).message}`);
    }
  }
}

export const exchangeRateService = new ExchangeRateService();
export default ExchangeRateService;
