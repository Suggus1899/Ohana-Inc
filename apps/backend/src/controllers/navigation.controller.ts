import { Request, Response } from 'express';
import dotenv from 'dotenv';
import * as osrmService from '../services/osrmService';
import { fetchWithTimeout } from '../utils/fetch-with-timeout';

dotenv.config();

const NOMINATIM_API_URL = process.env.NOMINATIM_API_URL || 'http://localhost:8181';

export const calculateRoute = async (req: Request, res: Response) => {
  try {
    const { origin, destination, mode = 'foot' } = req.body;

    if (!origin || !destination || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Origin and destination coordinates are required' }
      });
    }

    const validModes = ['foot', 'bike', 'car'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_MODE', message: 'Invalid transport mode' }
      });
    }

    const routeData = await osrmService.getRoute(origin, destination, mode as any);

    res.json({
      success: true,
      data: routeData
    });
  } catch (error: any) {
    console.error('Navigation Controller Error:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'ROUTING_ERROR', message: error.message || 'Error calculating route' }
    });
  }
};

export const geocode = async (req: Request, res: Response) => {
  try {
    const address = req.query.address as string;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_ADDRESS', message: 'Address query parameter is required' }
      });
    }

    // Geocoding local (Nominatim-compatible)
    const url = `${NOMINATIM_API_URL}/search?q=${encodeURIComponent(address)}&format=json&limit=5`;

    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Ohana/1.0 (plataforma de alquileres)'
      }
    });

    if (!response.ok) {
      throw new Error('Nominatim service unavailable');
    }

    const data = await response.json() as any[];

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No se encontraron coordenadas para la dirección proporcionada' }
      });
    }

    const result = data[0];

    res.json({
      success: true,
      data: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon), // Nominatim usa 'lon' en lugar de 'lng'
        address: result.display_name
      }
    });
  } catch (error: any) {
    console.error('Geocoding Controller Error:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'GEOCODING_ERROR', message: error.message || 'Error al procesar la dirección' }
    });
  }
};
