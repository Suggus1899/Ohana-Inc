const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3026/api';

export interface RouteCoordinates {
  lat: number;
  lng: number;
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
}

export interface RouteData {
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
  steps: RouteStep[];
}

interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: { message?: string };
  data: T;
}

export const calculateRoute = async (
  origin: RouteCoordinates,
  destination: RouteCoordinates,
  mode: 'foot' | 'bike' | 'car' = 'foot'
): Promise<RouteData> => {
  try {
    const response = await fetch(`${API_URL}/navigation/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination,
        mode
      }),
    });

    const data = await response.json() as ApiResponse<RouteData>;

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Error calculating route');
    }

    return data.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Routing Service Error:', message);
    throw new Error(message || 'Error connecting to routing service');
  }
};

export const geocodeAddress = async (address: string): Promise<RouteCoordinates & { display_name: string }> => {
  try {
    const response = await fetch(`${API_URL}/navigation/geocode?address=${encodeURIComponent(address)}`);
    const data = await response.json() as ApiResponse<{ lat: number; lng: number; address: string }>;
    
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Error geocoding address');
    }
    
    return {
      lat: data.data.lat,
      lng: data.data.lng,
      display_name: data.data.address
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Geocoding Service Error:', message);
    throw new Error(message || 'Error connecting to geocoding service');
  }
};
