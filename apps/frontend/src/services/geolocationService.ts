import { mockGeolocation } from '../test/geolocationMock';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export type GeolocationError = GeolocationPositionError;

export const isGeolocationSupported = (): boolean => {
  return 'geolocation' in navigator;
};

export const getCurrentPosition = (options?: PositionOptions): Promise<GeoPosition> => {
  if (import.meta.env.VITE_USE_MOCK_GEOLOCATION === 'true') {
    return new Promise((resolve) => {
      mockGeolocation.getCurrentPosition((pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        });
      });
    });
  }

  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(error);
      },
      options
    );
  });
};

export const watchPosition = (
  onSuccess: (position: GeoPosition) => void,
  onError: (error: GeolocationError) => void,
  options?: PositionOptions
): number => {
  if (import.meta.env.VITE_USE_MOCK_GEOLOCATION === 'true') {
    return mockGeolocation.watchPosition((pos) => {
      onSuccess({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp
      });
    });
  }

  if (!isGeolocationSupported()) {
    onError({
      code: 0,
      message: 'Geolocation is not supported by this browser.',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    } as GeolocationError);
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });
    },
    (error) => {
      onError(error);
    },
    options
  );
};

export const clearWatch = (watchId: number): void => {
  if (import.meta.env.VITE_USE_MOCK_GEOLOCATION === 'true') {
    mockGeolocation.clearWatch(watchId);
    return;
  }

  if (watchId !== -1) {
    navigator.geolocation.clearWatch(watchId);
  }
};
