import { useState, useEffect, useCallback } from 'react';
import * as geolocationService from '../services/geolocationService';
import { GeoPosition } from '../services/geolocationService';

export interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  requestPermission: () => Promise<void>;
  isSupported: boolean;
}

export const useGeolocation = (options?: PositionOptions): UseGeolocationReturn => {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSupported] = useState<boolean>(geolocationService.isGeolocationSupported());

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await geolocationService.getCurrentPosition(options);
      setPosition(pos);
    } catch (err: any) {
      setError(err.message || 'Error obtaining location');
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    if (!isSupported) {
      setError('Geolocation not supported');
      return;
    }

    const watchId = geolocationService.watchPosition(
      (pos) => {
        setPosition(pos);
        setError(null);
      },
      (err) => {
        setError(err.message || 'Error tracking location');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        ...options
      }
    );

    return () => {
      geolocationService.clearWatch(watchId);
    };
  }, [isSupported, options]);

  return {
    position,
    error,
    loading,
    requestPermission,
    isSupported
  };
};
