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

    const data = await response.json() as any;

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Error calculating route');
    }

    return data.data;
  } catch (error: any) {
    console.error('Routing Service Error:', error.message);
    throw new Error(error.message || 'Error connecting to routing service');
  }
};

export const geocodeAddress = async (address: string): Promise<RouteCoordinates & { display_name: string }> => {
  try {
    const response = await fetch(`${API_URL}/navigation/geocode?address=${encodeURIComponent(address)}`);
    const data = await response.json() as any;
    
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Error geocoding address');
    }
    
    return {
      lat: data.data.lat,
      lng: data.data.lng,
      display_name: data.data.address
    };
  } catch (error: any) {
    console.error('Geocoding Service Error:', error.message);
    throw new Error(error.message || 'Error connecting to geocoding service');
  }
};
