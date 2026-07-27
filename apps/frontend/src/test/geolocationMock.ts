const SJ_COORDINATES: [number, number][] = [
  [9.4111, -67.3592],
  [9.4105, -67.3585],
  [9.4098, -67.3578],
  [9.4092, -67.3570],
  [9.4085, -67.3562],
  [9.4078, -67.3555]
];

const UPDATE_INTERVAL = Number(import.meta.env.VITE_NAVIGATION_UPDATE_INTERVAL) || 3000;

class GeolocationMock {
  private currentIndex = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private watchCallbacks: Record<number, (pos: GeolocationPosition) => void> = {};
  private nextWatchId = 1;

  getCurrentPosition(success: (pos: GeolocationPosition) => void) {
    const coord = SJ_COORDINATES[this.currentIndex];
    success({
      coords: {
        latitude: coord[0],
        longitude: coord[1],
        accuracy: 10
      },
      timestamp: Date.now()
    });
  }

  watchPosition(success: (pos: GeolocationPosition) => void) {
    const id = this.nextWatchId++;
    this.watchCallbacks[id] = success;
    
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % SJ_COORDINATES.length;
        const coord = SJ_COORDINATES[this.currentIndex];
        const pos = {
          coords: {
            latitude: coord[0],
            longitude: coord[1],
            accuracy: 10
          },
          timestamp: Date.now()
        };
        
        Object.values(this.watchCallbacks).forEach(cb => cb(pos));
      }, UPDATE_INTERVAL);
    }
    
    return id;
  }

  clearWatch(id: number) {
    delete this.watchCallbacks[id];
    if (Object.keys(this.watchCallbacks).length === 0) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const mockGeolocation = new GeolocationMock();

// To use this, one could monkey-patch navigator.geolocation in dev mode
// if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_GEOLOCATION === 'true') {
//   (navigator as any).geolocation = mockGeolocation;
// }
