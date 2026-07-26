// Exchange rate service using ve.dolarapi.com
// Caches all rates in memory with configurable TTL

export type RateType = 'oficial' | 'paralelo';

export interface SingleRate {
  usdToVes: number;
  lastUpdated: Date;
  source: string;
}

export interface AllRates {
  rates: Record<RateType, SingleRate>;
  defaultRate: RateType;
}

interface DolarApiEntry {
  moneda: string;
  codigo?: string;
  nombre: string;
  fuente: string;
  promedio?: number;
  precio?: number;
  actualizado?: string;
  fechaActualizacion?: string;
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
   * Returns cached rates if still fresh, otherwise fetches from ve.dolarapi.com.
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
  async getRate(rateType: RateType = 'paralelo', forceRefresh = false): Promise<SingleRate> {
    const all = await this.getAllRates(forceRefresh);
    return all.rates[rateType];
  }

  /**
   * Convert USD to VES at a specific rate type.
   */
  async convertUsdToVes(usdAmount: number, rateType: RateType = 'paralelo'): Promise<number> {
    const rate = await this.getRate(rateType);
    return Math.round(usdAmount * rate.usdToVes * 100) / 100;
  }

  /**
   * Format USD amount with VES equivalent for display.
   */
  async formatDualPrice(usdAmount: number, rateType: RateType = 'paralelo'): Promise<{ usd: number; ves: number; rate: number }> {
    const rate = await this.getRate(rateType);
    const ves = Math.round(usdAmount * rate.usdToVes * 100) / 100;
    return { usd: usdAmount, ves, rate: rate.usdToVes };
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

  private getDate(d: DolarApiEntry): Date {
    return d.fechaActualizacion
      ? new Date(d.fechaActualizacion)
      : d.actualizado
        ? new Date(d.actualizado)
        : new Date();
  }

  private async fetchAllRates(): Promise<AllRates> {
    // Primary: fetch all rates from /v1/dolares
    try {
      const response = await fetch('https://ve.dolarapi.com/v1/dolares');
      const data = await response.json() as DolarApiEntry[];

      const findRate = (fuente: string) => data.find(d => d.fuente === fuente);
      const oficial = findRate('oficial');
      const paralelo = findRate('paralelo');

      const rates: Record<string, SingleRate> = {};

      if (oficial?.promedio) {
        rates.oficial = {
          usdToVes: oficial.promedio,
          lastUpdated: this.getDate(oficial),
          source: 've.dolarapi.com (oficial/BCV)',
        };
      }
      if (paralelo?.promedio) {
        rates.paralelo = {
          usdToVes: paralelo.promedio,
          lastUpdated: this.getDate(paralelo),
          source: 've.dolarapi.com (paralelo)',
        };
      }

      if (Object.keys(rates).length === 0) {
        throw new Error('No rates found in /v1/dolares');
      }

      return {
        rates: rates as Record<RateType, SingleRate>,
        defaultRate: 'oficial',
      };
    } catch (primaryErr) {
      // Fallback: try individual endpoints
      const rates: Record<string, SingleRate> = {};

      for (const codigo of ['paralelo', 'bcv']) {
        try {
          const resp = await fetch(`https://ve.dolarapi.com/v1/dolares/${codigo}`);
          if (!resp.ok) continue;
          const d = await resp.json() as DolarApiEntry;
          const rate = d.promedio || d.precio || 0;
          if (rate) {
            const key = codigo === 'bcv' ? 'oficial' : 'paralelo';
            rates[key] = {
              usdToVes: rate,
              lastUpdated: this.getDate(d),
              source: `ve.dolarapi.com/v1/dolares/${codigo}`,
            };
          }
        } catch { /* skip failed fallback */ }
      }

      if (Object.keys(rates).length === 0) {
        throw new Error(`Error obteniendo tasa de cambio: ${(primaryErr as Error).message}`);
      }

      return {
        rates: rates as Record<RateType, SingleRate>,
        defaultRate: rates.oficial ? 'oficial' : 'paralelo',
      };
    }
  }
}

export const exchangeRateService = new ExchangeRateService();
export default ExchangeRateService;
