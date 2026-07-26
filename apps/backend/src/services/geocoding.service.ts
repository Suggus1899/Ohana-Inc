import dotenv from 'dotenv';

dotenv.config();

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface GeocodeResult extends GeoCoordinates {
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  type?: string;
  importance?: number;
}

export interface ReverseGeocodeResult extends GeocodeResult {
  address?: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

// Usar solo OSRM/Nominatim local para geocoding - sin servicios externos
// En Docker: NOMINATIM_API_URL=http://osrm:8080 (geocoding) 
//            OSRM_API_URL=http://osrm:5000 (routing)
const NOMINATIM_API_URL = process.env.NOMINATIM_API_URL || 'http://localhost:8082';
const DEFAULT_RADIUS_KM = parseFloat(process.env.DEFAULT_SEARCH_RADIUS_KM || '10');

/**
 * Servicio de geocoding que usa EXCLUSIVAMENTE OSRM local
 * SIN fallback a servicios públicos o Google
 */
export class GeocodingService {
  /**
   * Convierte una dirección en coordenadas (geocoding) usando SOLO OSRM local
   */
  async addressToCoords(address: string): Promise<GeocodeResult | null> {
    try {
      // Usar SOLAMENTE Nominatim local para geocoding
      const osrmResult = await this.tryGeocode(address, NOMINATIM_API_URL);
      if (osrmResult) {
        console.log(`[Geocoding] Dirección encontrada en Nominatim local: ${address}`);
        return osrmResult;
      }

      console.warn(`[Geocoding] No se encontraron coordenadas para: ${address} usando Nominatim local`);
      return null;
    } catch (error) {
      console.error('Geocoding error (Nominatim local):', error);
      return null;
    }
  }

  /**
   * Convierte coordenadas en dirección (reverse geocoding) usando SOLO OSRM local
   */
  async coordsToAddress(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    try {
      // Usar SOLAMENTE Nominatim local para reverse geocoding
      const osrmResult = await this.tryReverseGeocode(lat, lng, NOMINATIM_API_URL);
      if (osrmResult) {
        return osrmResult;
      }

      console.warn(`[Geocoding] No se encontró dirección para coordenadas: ${lat}, ${lng} usando Nominatim local`);
      return null;
    } catch (error) {
      console.error('Reverse geocoding error (Nominatim local):', error);
      return null;
    }
  }

  /**
   * Busca lugares cercanos a unas coordenadas usando SOLO OSRM local
   */
  async searchNearby(lat: number, lng: number, radiusKm = DEFAULT_RADIUS_KM): Promise<GeocodeResult[]> {
    try {
      // Usar SOLAMENTE Nominatim local para búsqueda cercana
      const osrmResults = await this.trySearchNearby(lat, lng, radiusKm, NOMINATIM_API_URL);
      if (osrmResults.length > 0) {
        return osrmResults;
      }

      console.warn(`[Geocoding] No se encontraron lugares cercanos para: ${lat}, ${lng} usando Nominatim local`);
      return [];
    } catch (error) {
      console.error('Nearby search error (Nominatim local):', error);
      return [];
    }
  }

  /**
   * Busca autocompletado para sugerencias de direcciones usando SOLO OSRM local
   */
  async autocomplete(query: string, limit = 5): Promise<GeocodeResult[]> {
    try {
      // Usar SOLAMENTE Nominatim local para autocompletado
      const osrmResults = await this.tryAutocomplete(query, limit, NOMINATIM_API_URL);
      if (osrmResults.length > 0) {
        return osrmResults;
      }

      console.warn(`[Geocoding] No se encontraron sugerencias para: ${query} usando Nominatim local`);
      return [];
    } catch (error) {
      console.error('Autocomplete error (Nominatim local):', error);
      return [];
    }
  }

  /**
   * Calcula distancia entre dos puntos en kilómetros
   */
  calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Filtra propiedades por distancia a una ubicación
   */
  filterPropertiesByDistance(
    properties: any[],
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): any[] {
    return properties.filter(property => {
      if (!property.lat || !property.lng) return false;
      
      const distance = this.calculateDistanceKm(
        centerLat,
        centerLng,
        property.lat,
        property.lng
      );
      
      return distance <= radiusKm;
    });
  }

  /**
   * Obtiene las coordenadas aproximadas de una ciudad o ubicación
   * usando SOLO OSRM local para búsquedas por texto de ubicación
   */
  async getCoordinatesForLocation(location: string): Promise<GeoCoordinates | null> {
    // Buscar la ubicación completa usando solo OSRM local
    const results = await this.autocomplete(location, 1);
    
    if (results.length > 0) {
      console.log(`[Geocoding] Coordenadas encontradas para "${location}" usando Nominatim local`);
      return {
        lat: results[0].lat,
        lng: results[0].lng
      };
    }
    
    // Si no hay resultados exactos, buscar por palabras clave comunes usando OSRM local
    const locationKeywords = this.extractLocationKeywords(location);
    
    for (const keyword of locationKeywords) {
      const keywordResults = await this.autocomplete(keyword, 1);
      if (keywordResults.length > 0) {
        console.log(`[Geocoding] Coordenadas encontradas usando palabra clave "${keyword}" para "${location}"`);
        return {
          lat: keywordResults[0].lat,
          lng: keywordResults[0].lng
        };
      }
    }
    
    console.warn(`[Geocoding] No se encontraron coordenadas para: "${location}" usando Nominatim local`);
    return null;
  }

  // Métodos auxiliares para estrategia de fallback

  private async tryGeocode(address: string, baseUrl: string): Promise<GeocodeResult | null> {
    try {
      const url = `${baseUrl}/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Ohana/1.0 (plataforma de alquileres)'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        return null;
      }

      const item = data[0];
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
        type: item.type,
        importance: item.importance
      };
    } catch (error) {
      console.warn(`Geocoding falló en ${baseUrl}:`, error);
      return null;
    }
  }

  private async tryReverseGeocode(lat: number, lng: number, baseUrl: string): Promise<ReverseGeocodeResult | null> {
    try {
      const url = `${baseUrl}/reverse?lat=${lat}&lon=${lng}&format=json`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Ohana/1.0 (plataforma de alquileres)'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if ((data as any).error) {
        return null;
      }

      return {
        lat: parseFloat((data as any).lat),
        lng: parseFloat((data as any).lon),
        displayName: (data as any).display_name,
        city: (data as any).address?.city || (data as any).address?.town || (data as any).address?.village,
        state: (data as any).address?.state,
        country: (data as any).address?.country,
        address: (data as any).address
      };
    } catch (error) {
      console.warn(`Reverse geocoding falló en ${baseUrl}:`, error);
      return null;
    }
  }

  private async trySearchNearby(lat: number, lng: number, radiusKm: number, baseUrl: string): Promise<GeocodeResult[]> {
    try {
      const delta = radiusKm / 111; // Aproximadamente 1 grado = 111 km
      const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
      
      const url = `${baseUrl}/search?format=json&limit=20&viewbox=${viewbox}&bounded=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Ohana/1.0 (plataforma de alquileres)'
        }
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        city: item.address?.city || item.address?.town,
        state: item.address?.state,
        country: item.address?.country,
        type: item.type,
        importance: item.importance
      }));
    } catch (error) {
      console.warn(`Nearby search falló en ${baseUrl}:`, error);
      return [];
    }
  }

  private async tryAutocomplete(query: string, limit: number, baseUrl: string): Promise<GeocodeResult[]> {
    try {
      const url = `${baseUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Ohana/1.0 (plataforma de alquileres)'
        }
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
        type: item.type,
        importance: item.importance
      }));
    } catch (error) {
      console.warn(`Autocomplete falló en ${baseUrl}:`, error);
      return [];
    }
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private extractLocationKeywords(location: string): string[] {
    const keywords = [];
    const normalized = location.toLowerCase().trim();
    
    // Extraer palabras comunes de ubicación
    const words = normalized.split(/[\s,]+/).filter(w => w.length > 2);
    
    // Combinaciones de palabras para mejorar búsqueda
    for (let i = 0; i < Math.min(words.length, 3); i++) {
      for (let j = i + 1; j <= Math.min(words.length, 3); j++) {
        keywords.push(words.slice(i, j).join(' '));
      }
    }
    
    return keywords;
  }

}

export const geocodingService = new GeocodingService();