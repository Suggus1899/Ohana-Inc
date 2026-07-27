import { useState, useCallback } from 'react';
import * as routingService from '../services/routingService';
import { RouteCoordinates, RouteData } from '../services/routingService';

export interface UseRouteCalculationReturn {
  route: RouteData | null;
  loading: boolean;
  error: string | null;
  calculateRoute: (
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    mode?: 'foot' | 'bike' | 'car'
  ) => Promise<void>;
  clearRoute: () => void;
}

export const useRouteCalculation = (): UseRouteCalculationReturn => {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = useCallback(async (
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    mode: 'foot' | 'bike' | 'car' = 'foot'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const routeData = await routingService.calculateRoute(origin, destination, mode);
      setRoute(routeData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error calculating route');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return {
    route,
    loading,
    error,
    calculateRoute,
    clearRoute
  };
};
