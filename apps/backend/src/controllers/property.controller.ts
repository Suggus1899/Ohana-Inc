import { Request, Response } from 'express';
import { Property, User, Service, PropertyAssignment, Transaction } from '../models';
import { Op, WhereOptions, Sequelize } from 'sequelize';
import { PropertyAttributes, AuthRequest } from '../types';
import { sequelize } from '../config/database';
import { fetchWithTimeout } from '../utils/fetch-with-timeout';
import { propertyService } from '../services/property.service';
import { mediaProcessingService } from '../services/media-processing.service';
import { TransactionStatus } from '../models/Transaction';
import { geocodingService } from '../services/geocoding.service';

const NOMINATIM_API_URL = process.env.NOMINATIM_API_URL || 'http://localhost:8181';

// Declaración para evitar error de TypeScript si los tipos de Node no se cargan correctamente
declare const console: any;

function parseFeatures(f: unknown): string[] {
  if (typeof f === 'string') {
    try { return JSON.parse(f); } catch { return []; }
  }
  if (Array.isArray(f)) {
    return f
      .flatMap((item: unknown) => {
        if (typeof item === 'string' && item.startsWith('[') && item.endsWith(']')) {
          try { return JSON.parse(item); } catch { return item; }
        }
        return item;
      })
      .filter((item: unknown): item is string => typeof item === 'string' && item.length > 0);
  }
  return [];
}

export const getProperties = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const result = await propertyService.searchProperties({
      search: req.query.search as string | undefined,
      type: req.query.type as string | undefined,
      listingType: req.query.listingType as string | undefined,
      minPrice: req.query.minPrice as string | undefined,
      maxPrice: req.query.maxPrice as string | undefined,
      bedrooms: req.query.bedrooms as string | undefined,
      bathrooms: req.query.bathrooms as string | undefined,
      furnished: req.query.furnished as string | undefined,
      location: req.query.location as string | undefined,
      status: req.query.status as string | undefined,
      isFeatured: req.query.isFeatured as string | undefined,
      moderatorId: req.query.moderatorId as string | undefined,
      features: req.query.features as string | string[] | undefined,
      services: req.query.services as string | string[] | undefined,
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
      lat: req.query.lat as string | undefined,
      lng: req.query.lng as string | undefined,
      radius: req.query.radius as string | undefined,
      includeUnavailable: req.query.includeUnavailable === 'true',
      userRole: authReq.user?.role,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Error al cargar las propiedades' },
    });
  }
};

export const updatePropertyStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const authReq = req as AuthRequest;
    const moderatorId = authReq.user ? Number(authReq.user.userId) : 0;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid status' }
      });
    }

    const property = await (Property as any).findByPk(id, { paranoid: false });
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' }
      });
    }

    await (property as any).update({ 
      status: status as any,
      moderatorId: moderatorId,
      rejectionReason: status === 'rejected' ? reason : null
    });

    res.json({
      success: true,
      data: { property }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

export const getPropertyById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const viewerUserId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string || undefined;
    const source = req.query.source as string || 'direct';
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = /mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : /tablet/i.test(userAgent) ? 'tablet' : 'desktop';

    const property = await propertyService.getPropertyById(Number(id), {
      viewerUserId,
      sessionId,
      source,
      deviceType,
    });

    // Re-fetch with author include for the response
    const propertyWithAuthor = await (Property as any).findByPk(id, {
      include: [
        {
          model: (User as any),
          as: 'author',
          attributes: ['id', 'name', 'email', 'phonePrefix', 'phone', 'profilePhotoUrl', 'avgRatingAsOwner', 'reviewCountAsOwner', 'isVerified']
        }
      ]
    });

    if (!propertyWithAuthor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' }
      });
    }

    res.json({ success: true, data: { property: propertyWithAuthor } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
};

export const getPropertyCountsByType = async (_req: Request, res: Response) => {
  try {
    const counts = await (Property as any).findAll({
      attributes: ['type', [Sequelize.fn('COUNT', Sequelize.col('type')), 'count']],
      where: { status: 'approved' },
      group: ['type'],
      raw: true,
    }) as unknown as { type: string; count: number }[];
    res.json({ success: true, data: { counts } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
};

export const createProperty = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const authorId = authReq.user ? Number(authReq.user.userId) : 0;

    // Check owner has no disputed transactions
    const dispute = await Transaction.findOne({
      where: {
        ownerId: authorId,
        status: TransactionStatus.DISPUTED,
      },
    });
    if (dispute) {
      res.status(409).json({
        success: false,
        error: {
          code: "OWNER_HAS_DISPUTE",
          message: "No puedes publicar propiedades mientras tengas una transacción en disputa",
        },
      });
      return;
    }

    const files = req.files as any;

    const imagePaths = files?.images?.map((f: any) => f.path) ?? [];
    const videoPath = files?.video?.[0]?.path;

    const property = await propertyService.createProperty({
      ...req.body,
      authorId,
      imagePaths,
      videoPath,
      bedrooms: Number(req.body.bedrooms ?? 0),
      bathrooms: Number(req.body.bathrooms ?? 0),
      roomsWithBathroom: Number(req.body.roomsWithBathroom ?? 0),
      outsideBathrooms: Number(req.body.outsideBathrooms ?? 0),
      availableRooms: Number(req.body.availableRooms ?? 0),
      occupiedRooms: Number(req.body.occupiedRooms ?? 0),
      area: Number(req.body.area ?? 0),
      price: Number(req.body.price),
      lat: Number(req.body.lat),
      lng: Number(req.body.lng),
      furnished: req.body.furnished === 'true' || req.body.furnished === true,
      features: parseFeatures(req.body.features),
    });

    res.status(201).json({
      success: true,
      data: { property }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

export const getZones = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '50' } = req.query;
    const radiusKm = Number(radius);

    const dbZones = await Property.findAll({
      where: { status: 'approved' },
      attributes: [
        'location',
        'city',
        [sequelize.fn('COUNT', sequelize.col('id')), 'propertyCount'],
      ],
      group: ['location', 'city'],
      raw: true,
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
    });

    let filteredRows: any[] = dbZones;

    if (lat && lng) {
      const userLat = Number(lat);
      const userLng = Number(lng);

      let userCity = '';
      try {
        const url = `${NOMINATIM_API_URL}/reverse?lat=${userLat}&lon=${userLng}&format=json&addressdetails=1`;
        const response = await fetchWithTimeout(url, {
          headers: { 'User-Agent': 'Ohana/1.0', 'Accept-Language': 'es' },
        });
        if (response.ok) {
          const data = await response.json();
          const addr = (data as any).address || {};
          userCity = (addr.city || addr.town || addr.village || '').toLowerCase().trim();
        }
      } catch { /* si Nominatim falla, continuar sin filtro de ciudad */ }

      if (userCity) {
        filteredRows = dbZones.filter((z: any) => {
          const zoneCity = ((z as any).city || '').toLowerCase().trim();
          return zoneCity === userCity || zoneCity.includes(userCity) || userCity.includes(zoneCity);
        });
      }

      if (filteredRows.length === 0) {
        const allProps = await Property.findAll({
          where: { status: 'approved' },
          attributes: ['id', 'location', 'city', 'lat', 'lng'],
          raw: true,
        });

        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };

        const zoneMap = new Map<string, { location: string; city: string; distances: number[] }>();
        for (const prop of allProps as any[]) {
          const dist = calculateDistance(userLat, userLng, prop.lat, prop.lng);
          if (dist <= radiusKm) {
            const key = `${prop.location}|${prop.city}`;
            if (!zoneMap.has(key)) {
              zoneMap.set(key, { location: prop.location, city: prop.city, distances: [] });
            }
            zoneMap.get(key)!.distances.push(dist);
          }
        }

        filteredRows = Array.from(zoneMap.values())
          .map(z => ({
            location: z.location,
            city: z.city,
            propertyCount: z.distances.length,
            avgDistance: z.distances.reduce((a, b) => a + b, 0) / z.distances.length,
          }))
          .sort((a, b) => a.avgDistance - b.avgDistance || b.propertyCount - a.propertyCount);
      }
    }

    const zones = filteredRows
      .filter((z: any) => z.location && z.location.trim())
      .map((z: any) => z.location.trim())
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

    res.json({
      success: true,
      data: { zones },
    });
  } catch (error: any) {
    console.error('Error fetching zones:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ZONES_ERROR', message: 'Error al cargar las zonas' },
    });
  }
};

export const getLocationSuggestions = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length < 2) {
      return res.json({ success: true, data: { suggestions: [] } });
    }

    const search = String(q).trim();

    const results = await Property.findAll({
      where: {
        status: 'approved',
        [Op.or]: [
          { location: { [Op.iLike]: `%${search}%` } },
          { city: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
          { neighborhood: { [Op.iLike]: `%${search}%` } },
        ],
      },
      attributes: [
        'location',
        'city',
        'neighborhood',
        'address',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['location', 'city', 'neighborhood', 'address'],
      raw: true,
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
    });

    const suggestions = results
      .map((r: any) => ({
        label: r.location || r.neighborhood || '',
        sublabel: r.city || r.address || '',
        address: r.address || '',
        city: r.city || '',
        count: r.count,
      }))
      .filter((s: { label: string; sublabel: string }) => s.label || s.sublabel);

    res.json({ success: true, data: { suggestions } });
  } catch (error: any) {
    console.error('Error fetching location suggestions:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SUGGESTIONS_ERROR', message: 'Error al obtener sugerencias' },
    });
  }
};

export const publishProperty = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const ownerId = Number(authReq.user?.userId);
    const { id } = req.params;

    // Check owner has no disputed transactions
    const dispute = await Transaction.findOne({
      where: { ownerId, status: TransactionStatus.DISPUTED },
    });
    if (dispute) {
      res.status(409).json({
        success: false,
        error: {
          code: "OWNER_HAS_DISPUTE",
          message: "No puedes publicar propiedades mientras tengas una transacción en disputa",
        },
      });
      return;
    }

    const property = await propertyService.publishProperty(Number(id), ownerId);

    res.json({
      success: true,
      data: { property }
    });
  } catch (error: any) {
    const status = error.message.includes('No autorizado') ? 403
      : error.message.includes('no encontrada') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: { code: 'PUBLISH_ERROR', message: error.message }
    });
  }
};

export const getMyProperties = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const ownerId = Number(authReq.user?.userId);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 12);

    const { rows, count } = await propertyService.getOwnerProperties(ownerId, page, limit);

    res.json({
      success: true,
      data: {
        properties: (rows as any[]),
        total: count,
        page,
        pages: Math.ceil(count / limit),
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const authorId = authReq.user ? Number(authReq.user.userId) : 0;
    const userRole = authReq.user?.role;

    const property = await (Property as any).findByPk(id, { paranoid: false });
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' }
      });
    }

    if ((property as any).authorId !== authorId && !['admin', 'operator'].includes(String(userRole))) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to update this property' }
      });
    }

    const files = req.files as any;
    const newImagePaths = files?.images?.map((f: any) => f.path) ?? [];
    const newVideoPath = files?.video?.[0]?.path;

    const updateData: any = { ...req.body };

    // Parse numeric fields if they are strings (from FormData)
    if (typeof updateData.bedrooms === 'string') updateData.bedrooms = Number(updateData.bedrooms);
    if (typeof updateData.bathrooms === 'string') updateData.bathrooms = Number(updateData.bathrooms);
    if (typeof updateData.roomsWithBathroom === 'string') updateData.roomsWithBathroom = Number(updateData.roomsWithBathroom);
    if (typeof updateData.outsideBathrooms === 'string') updateData.outsideBathrooms = Number(updateData.outsideBathrooms);
    if (typeof updateData.availableRooms === 'string') updateData.availableRooms = Number(updateData.availableRooms);
    if (typeof updateData.occupiedRooms === 'string') updateData.occupiedRooms = Number(updateData.occupiedRooms);
    if (typeof updateData.area === 'string') updateData.area = Number(updateData.area);
    if (typeof updateData.price === 'string') updateData.price = Number(updateData.price);
    if (typeof updateData.lat === 'string') updateData.lat = Number(updateData.lat);
    if (typeof updateData.lng === 'string') updateData.lng = Number(updateData.lng);
    if (typeof updateData.furnished === 'string') updateData.furnished = updateData.furnished === 'true';

    // Parse features robustly (handles string, array, and double-serialized arrays)
    updateData.features = parseFeatures(updateData.features);

    // Merge existing images with new ones (new images APPEND to existing)
    let mergedImages: string[] = [];
    let hasExistingImages = false;

    if (updateData.existingImages) {
      try {
        mergedImages = JSON.parse(updateData.existingImages);
        delete updateData.existingImages;
        hasExistingImages = true;
      } catch (e) {}
    }

    if (newImagePaths.length > 0) {
      const { processedPaths } = await mediaProcessingService.processImages(newImagePaths);
      const processedImages = processedPaths.map((p) => mediaProcessingService.toPublicUrl(p));
      mergedImages = [...mergedImages, ...processedImages];
    }

    if (hasExistingImages || mergedImages.length > 0) {
      updateData.images = mergedImages;
      updateData.mainImage = mergedImages[0] ?? '';
    }

    // Process new video
    if (newVideoPath) {
      const { videoPath: vp } = await mediaProcessingService.processVideo(newVideoPath);
      updateData.videoUrl = mediaProcessingService.toPublicUrl(vp);
    }

    await (property as any).update(updateData);

    res.json({
      success: true,
      data: { property }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const authorId = authReq.user ? Number(authReq.user.userId) : 0;
    const userRole = authReq.user?.role;

    const property = await (Property as any).findByPk(id, { paranoid: false });
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' }
      });
    }

    if ((property as any).authorId !== authorId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this property' }
      });
    }

    if ((property as any).type === 'Residencia' && Number((property as any).occupiedRooms) > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'RESIDENCIA_HAS_OCCUPIED_ROOMS', message: 'No se puede eliminar una residencia con habitaciones ocupadas' }
      });
    }

    if ((property as any).deletedAt) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_DELETED', message: 'La propiedad ya fue eliminada' }
      });
    }

    await Property.update(
      { deletedAt: new Date() },
      { where: { id: Number(id) } }
    );

    res.json({
      success: true,
      data: { message: 'Property deleted successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: error.message }
    });
  }
};

export const assignModerator = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { moderatorId } = req.body;
    const adminId = Number(req.user?.userId);

    if (!moderatorId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'moderatorId es requerido' }
      });
    }

    const property = await (Property as any).findByPk(id, { paranoid: false });
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' }
      });
    }

    const moderator = await User.findByPk(Number(moderatorId));
    if (!moderator || moderator.role !== 'operator') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'El moderador debe ser un operador válido' }
      });
    }

    await (property as any).update({ moderatorId: Number(moderatorId) });

    res.json({
      success: true,
      data: { message: 'Moderador asignado correctamente', property }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

/**
 * Búsqueda de propiedades por ubicación textual (geocoding)
 */
export const searchPropertiesByLocation = async (req: Request, res: Response) => {
  try {
    const { location, radius = '10', page = '1', limit = '12' } = req.query;

    if (!location || typeof location !== 'string') {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'LOCATION_REQUIRED', 
          message: 'Se requiere una ubicación para buscar (ejemplo: "la morera", "las palmas", "santa rosa")' 
        }
      });
    }

    // Obtener coordenadas de la ubicación textual
    const coords = await geocodingService.getCoordinatesForLocation(location.trim());
    
    if (!coords) {
      return res.status(404).json({
        success: false,
        error: { 
          code: 'LOCATION_NOT_FOUND', 
          message: 'No se encontraron coordenadas para la ubicación especificada' 
        }
      });
    }

    // Usar el método getProperties existente con coordenadas convertidas
    const mockReq = {
      ...req,
      query: {
        ...req.query,
        lat: coords.lat.toString(),
        lng: coords.lng.toString(),
        radius,
        page,
        limit
      }
    };

    // Reutilizar la lógica de getProperties
    await getProperties(mockReq as any, res);

  } catch (error: any) {
    console.error('Error en búsqueda por ubicación:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'SEARCH_ERROR', 
        message: 'Error al buscar propiedades por ubicación' 
      }
    });
  }
};

/**
 * Búsqueda de propiedades cerca de coordenadas específicas
 */
export const searchPropertiesNearby = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '10', page = '1', limit = '12' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'COORDINATES_REQUIRED', 
          message: 'Se requieren coordenadas (lat y lng) para buscar propiedades cercanas' 
        }
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'INVALID_COORDINATES', 
          message: 'Las coordenadas y radio deben ser números válidos' 
        }
      });
    }

    // Usar getProperties existente con coordenadas
    const mockReq = {
      ...req,
      query: {
        ...req.query,
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: radiusKm.toString(),
        page,
        limit
      }
    };

    // Reutilizar la lógica de getProperties
    await getProperties(mockReq as any, res);

  } catch (error: any) {
    console.error('Error en búsqueda cercana:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'NEARBY_SEARCH_ERROR', 
        message: 'Error al buscar propiedades cercanas' 
      }
    });
  }
};

/**
 * Autocompletado de ubicaciones para el buscador
 */
export const autocompleteLocations = async (req: Request, res: Response) => {
  try {
    const { query, limit = '5' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'QUERY_REQUIRED', 
          message: 'Se requiere un término de búsqueda para autocompletar' 
        }
      });
    }

    const limitNum = Math.min(parseInt(limit as string, 10) || 5, 20);
    const results = await geocodingService.autocomplete(query.trim(), limitNum);

    res.json({
      success: true,
      data: {
        query,
        suggestions: results.map(result => ({
          displayName: result.displayName,
          coordinates: { lat: result.lat, lng: result.lng },
          city: result.city,
          state: result.state,
          country: result.country,
          type: result.type,
          importance: result.importance
        }))
      }
    });

  } catch (error: any) {
    console.error('Error en autocompletado:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'AUTOCOMPLETE_ERROR', 
        message: 'Error al obtener sugerencias de ubicación' 
      }
    });
  }
};

/**
 * Reverse geocoding: convertir coordenadas en dirección
 */
export const reverseGeocode = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'COORDINATES_REQUIRED', 
          message: 'Se requieren coordenadas (lat y lng) para reverse geocoding' 
        }
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'INVALID_COORDINATES', 
          message: 'Las coordenadas deben ser números válidos' 
        }
      });
    }

    const result = await geocodingService.coordsToAddress(latitude, longitude);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { 
          code: 'ADDRESS_NOT_FOUND', 
          message: 'No se encontró una dirección para las coordenadas especificadas' 
        }
      });
    }

    res.json({
      success: true,
      data: {
        coordinates: { lat: latitude, lng: longitude },
        address: result.displayName,
        city: result.city,
        state: result.state,
        country: result.country,
        detailedAddress: result.address
      }
    });

  } catch (error: any) {
    console.error('Error en reverse geocoding:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'REVERSE_GEOCODING_ERROR', 
        message: 'Error al convertir coordenadas en dirección' 
      }
    });
  }
};
