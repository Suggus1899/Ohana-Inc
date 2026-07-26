import dotenv from 'dotenv';
import { osrmMockData } from '../mocks/osrmMockData';
import { fetchWithTimeout } from '../utils/fetch-with-timeout';

dotenv.config();

const OSRM_API_URL = process.env.OSRM_API_URL || 'http://localhost:5000';
const USE_OSRM_MOCK = process.env.USE_OSRM_MOCK === 'true';
const NODE_ENV = process.env.NODE_ENV || 'development';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
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
  geometry: RouteGeometry;
  distance: number;
  duration: number;
  steps: RouteStep[];
}

const getSpanishInstruction = (type: string, modifier: string | undefined, name: string, distance: number): string => {
  const translations: Record<string, string> = {
    'turn': 'Gire',
    'new name': 'Continúe por',
    'depart': 'Inicie su recorrido',
    'arrive': 'Llegue a',
    'merge': 'Incorpórese a',
    'on ramp': 'Tome la rampa hacia',
    'off ramp': 'Salga de la rampa hacia',
    'fork': 'Tome el desvío',
    'end of road': 'Al final de la calle, gire',
    'use lane': 'Use el carril hacia',
    'continue': 'Continúe por',
    'roundabout': 'En la rotonda, tome la salida hacia',
    'rotary': 'En la rotonda, tome la salida hacia',
    'roundabout turn': 'En la rotonda, gire',
    'notification': 'Continúe hacia',
  };

  const modifiers: Record<string, string> = {
    'left': 'a la izquierda',
    'right': 'a la derecha',
    'sharp left': 'totalmente a la izquierda',
    'sharp right': 'totalmente a la derecha',
    'slight left': 'ligeramente a la izquierda',
    'slight right': 'ligeramente a la derecha',
    'straight': 'recto',
    'uturn': 'en U',
  };

  const action = translations[type] || type;
  const direction = modifier ? modifiers[modifier] || modifier : '';
  const roadName = name !== 'Calle sin nombre' ? ` hacia ${name}` : '';
  const distText = distance > 0 ? `En ${Math.round(distance)} metros, ` : '';

  if (type === 'arrive') return `Usted ha llegado a su destino: ${name}`;
  if (type === 'depart') return `${action} por ${name} y camine ${Math.round(distance)} metros`;
  
  return `${distText}${action} ${direction}${roadName}`.trim();
};

const transformOSRMResponse = (data: any): RouteData => {
  const route = data.routes[0];
  
  const steps = route.legs[0].steps.map((step: any) => ({
    distance: step.distance,
    duration: step.duration,
    instruction: getSpanishInstruction(
      step.maneuver.type, 
      step.maneuver.modifier, 
      step.name || 'Calle sin nombre', 
      step.distance
    ),
    name: step.name || 'Calle sin nombre',
    maneuver: {
      type: step.maneuver.type,
      modifier: step.maneuver.modifier,
      location: step.maneuver.location
    }
  }));

  return {
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
    steps
  };
};

export const getRoute = async (
  origin: LatLng,
  destination: LatLng,
  mode: 'foot' | 'bike' | 'car' = 'foot'
): Promise<RouteData> => {
  const profile = mode === 'foot' ? 'walking' : mode === 'bike' ? 'cycling' : 'driving';
  const url = `${OSRM_API_URL}/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&annotations=true`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error('OSRM service unavailable');
    
    const data = await response.json() as any;

    if (data.code !== 'Ok') {
      throw new Error(`OSRM Error: ${data.code}`);
    }

    return transformOSRMResponse(data);
  } catch (error: any) {
    console.error('OSRM API Error:', error.message);
    
    // Fallback Mock (Resolución Funcional - OSRM Mock Fallback)
    if (USE_OSRM_MOCK || NODE_ENV === 'development') {
      console.warn('Usando datos mock de OSRM debido a fallo en el servicio o configuración de desarrollo');
      return transformOSRMResponse(osrmMockData.walking_route);
    }
    
    throw new Error('No se pudo calcular la ruta. Verifique su conexión o intente más tarde.');
  }
};
