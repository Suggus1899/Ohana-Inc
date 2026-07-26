const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3026/api';

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

/**
 * Servicio de geocoding para Habitas
 * Usa el backend con servidores OSRM y geocoding local
 */
export const geocodingService = {
  /**
   * Convierte una dirección en coordenadas (geocoding)
   */
  async addressToCoords(address: string): Promise<GeocodeResult> {
    try {
      const results = await this.autocomplete(address, 1);

      if (results.length === 0) {
        throw new Error(`No se encontraron coordenadas para: ${address}`);
      }

      return results[0];
    } catch (error: any) {
      console.error('Geocoding error:', error);
      throw new Error(`Error al geocodificar dirección: ${error.message}`);
    }
  },

  /**
   * Convierte coordenadas en dirección (reverse geocoding)
   */
  async coordsToAddress(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    try {
      const response = await fetch(`${API_URL}/properties/search/reverse?lat=${lat}&lng=${lng}`);
      const data = await response.json() as any;

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Error en reverse geocoding');
      }

      return {
        lat,
        lng,
        displayName: data.data.address,
        city: data.data.city,
        state: data.data.state,
        country: data.data.country,
        address: data.data.detailedAddress
      };
    } catch (error: any) {
      console.error('Reverse geocoding error:', error);
      throw new Error(`Error al convertir coordenadas en dirección: ${error.message}`);
    }
  },

  /**
   * Autocompletado de direcciones
   */
  async autocomplete(query: string, limit = 5): Promise<GeocodeResult[]> {
    try {
      const response = await fetch(`${API_URL}/properties/search/autocomplete?query=${encodeURIComponent(query)}&limit=${limit}`);
      const data = await response.json() as any;

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Error en autocompletado');
      }

      return (data.data.suggestions || []).map((s: any) => ({
        lat: s.coordinates?.lat ?? s.lat,
        lng: s.coordinates?.lng ?? s.lng,
        displayName: s.displayName,
        city: s.city,
        state: s.state,
        country: s.country,
        type: s.type,
        importance: s.importance,
      }));
    } catch (error: any) {
      console.error('Autocomplete error:', error);
      return [];
    }
  },

  /**
   * Busca propiedades por ubicación textual
   */
  async searchPropertiesByLocation(location: string, radiusKm = 10, page = 1, limit = 12) {
    try {
      const response = await fetch(
        `${API_URL}/properties/search/location?location=${encodeURIComponent(location)}&radius=${radiusKm}&page=${page}&limit=${limit}`
      );
      const data = await response.json() as any;

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Error buscando propiedades por ubicación');
      }

      return data.data;
    } catch (error: any) {
      console.error('Search by location error:', error);
      throw new Error(`Error buscando propiedades: ${error.message}`);
    }
  },

  /**
   * Busca propiedades cercanas a coordenadas
   */
  async searchPropertiesNearby(lat: number, lng: number, radiusKm = 10, page = 1, limit = 12) {
    try {
      const response = await fetch(
        `${API_URL}/properties/search/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}&page=${page}&limit=${limit}`
      );
      const data = await response.json() as any;

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Error buscando propiedades cercanas');
      }

      return data.data;
    } catch (error: any) {
      console.error('Search nearby error:', error);
      throw new Error(`Error buscando propiedades cercanas: ${error.message}`);
    }
  },

  /**
   * Verifica el estado del servicio de geocoding
   */
  async checkHealth(): Promise<{ healthy: boolean; services: string[] }> {
    try {
      // Intentar conectar al endpoint de salud del servidor de geocoding local
      const localResponse = await fetch('http://localhost:8081/health', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }).catch(() => null);

      const services = [];
      
      if (localResponse?.ok) {
        services.push('local-geocoding');
      }

      // Verificar conexión al backend
      const backendResponse = await fetch(`${API_URL}/properties/search/autocomplete?query=test`);
      if (backendResponse.ok) {
        services.push('backend-geocoding');
      }

      return {
        healthy: services.length > 0,
        services
      };
    } catch (error) {
      console.error('Health check error:', error);
      return { healthy: false, services: [] };
    }
  },

  /**
   * Ejemplos de búsqueda que funcionan con el sistema
   */
  getExamples(): string[] {
    return [
      'la morera',
      'las palmas',
      'santa rosa',
      'unal',
      'bogotá',
      'medellín',
      'uniandes',
      'residencias estudiantiles'
    ];
  }
};