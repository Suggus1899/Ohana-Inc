import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { fetchExchangeRate, type ExchangeRateData, type RateType, getRate } from '../utils/formatPrice';

export interface ExchangeRateContextValue {
  rate: ExchangeRateData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** Get COP value for a USD amount at a specific rate type */
  getCopFor: (usdAmount: number, rateType?: RateType) => number;
  /** Get rate info for a specific rate type */
  getRateType: (rateType?: RateType) => { usdToCop: number } | null;
}

const ExchangeRateContext = createContext<ExchangeRateContextValue>({
  rate: null,
  loading: true,
  error: null,
  refresh: () => {},
  getCopFor: () => 0,
  getRateType: () => null,
});

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function ExchangeRateProvider({ children }: { children: ReactNode }) {
  const [rate, setRate] = useState<ExchangeRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchExchangeRate();
      if (data.usdToCop > 0) {
        setRate(data);
      } else {
        setError('No se pudo obtener la TRM');
      }
    } catch (e) {
      setError('Error al obtener la TRM');
    } finally {
      setLoading(false);
    }
  }, []);

  const getCopFor = useCallback(
    (usdAmount: number, rateType?: RateType): number => {
      if (!rate?.rates) return 0;
      const r = getRate(rate.rates, rateType);
      if (!r || r.usdToCop === 0) return 0;
      return Math.round(usdAmount * r.usdToCop * 100) / 100;
    },
    [rate],
  );

  const getRateType = useCallback(
    (rateType?: RateType): { usdToCop: number } | null => {
      if (!rate?.rates) return null;
      const r = getRate(rate.rates, rateType);
      return r ? { usdToCop: r.usdToCop } : null;
    },
    [rate],
  );

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <ExchangeRateContext.Provider value={{ rate, loading, error, refresh: load, getCopFor, getRateType }}>
      {children}
    </ExchangeRateContext.Provider>
  );
}

export function useExchangeRate() {
  return useContext(ExchangeRateContext);
}
