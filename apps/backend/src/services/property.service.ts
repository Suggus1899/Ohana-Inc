import { Op, WhereOptions, Sequelize } from 'sequelize';
import Property from '../models/Property';
import User from '../models/User';
import Service from '../models/Service';
import Favorite from '../models/Favorite';
import PropertyView from '../models/PropertyView';
import { mediaProcessingService } from './media-processing.service';
import { PropertyCreationAttributes, PropertyStatus } from '../types';
import { notificationInAppService } from './notification-inapp.service';
import { geocodingService } from './geocoding.service';
import { sequelize } from '../config/database';

export interface PropertyFilters {
  search?: string;
  type?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number | string;
  bathrooms?: number;
  furnished?: boolean;
  location?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

export interface PropertySearchInput {
  search?: string;
  type?: string;
  listingType?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  bedrooms?: string | number;
  bathrooms?: string | number;
  furnished?: string | boolean;
  location?: string;
  city?: string;
  status?: string;
  isFeatured?: string;
  moderatorId?: string | number;
  features?: string | string[];
  services?: string | string[];
  page?: string | number;
  limit?: string | number;
  lat?: string | number;
  lng?: string | number;
  radius?: string | number;
  includeUnavailable?: boolean;
  userRole?: string;
}

export interface PropertySearchResult {
  properties: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  geocoding?: {
    searchLocation: string;
    coordinates: { lat: number; lng: number };
    radiusKm: number;
    foundProperties: number;
  };
}

export interface CreatePropertyInput extends Omit<PropertyCreationAttributes, 'images' | 'mainImage' | 'status' | 'isVerified' | 'isFeatured' | 'views'> {
  imagePaths?: string[];
  videoPath?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  views?: number;
}

export class PropertyService {
  /**
   * Full property search with geocoding, haversine distance, in-memory
   * feature filtering, student prioritization, and pagination.
   *
   * Extracted from property.controller.ts so the controller stays thin.
   */
  async searchProperties(input: PropertySearchInput): Promise<PropertySearchResult> {
    const {
      search, type, listingType, minPrice, maxPrice,
      bedrooms, bathrooms, furnished, location, status,
      isFeatured, moderatorId, features, services,
      page = 1, limit = 12,
      lat, lng, radius, includeUnavailable, userRole,
    } = input;

    const where: any = {};

    // Base filters - only show approved by default
    if (status) {
      where.status = status;
    } else if (!includeUnavailable) {
      where.status = 'approved';
    }

    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';
    if (moderatorId) where.moderatorId = Number(moderatorId);

    // Text search
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Property characteristics
    if (type && type !== 'all') where.type = type;
    if (listingType && listingType !== 'all') where.listingType = listingType;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    if (bedrooms && bedrooms !== 'all') {
      const bedroomsStr = String(bedrooms);
      if (bedroomsStr === '4+') {
        where.bedrooms = { [Op.gte]: 4 };
      } else {
        where.bedrooms = Number(bedrooms);
      }
    }
    if (bathrooms && String(bathrooms) !== 'all') where.bathrooms = Number(bathrooms);
    if (furnished !== undefined && String(furnished) !== 'all') where.furnished = furnished === 'true';
    if (location) where.location = { [Op.iLike]: `%${location}%` };

    // Geocoding: convert location text to coordinates
    let geoLat: number | undefined;
    let geoLng: number | undefined;
    let geoRadius: number | undefined;
    let searchLocation: string | undefined;

    if (location && typeof location === 'string' && location.trim()) {
      try {
        const coords = await geocodingService.getCoordinatesForLocation(location.trim());
        if (coords) {
          geoLat = coords.lat;
          geoLng = coords.lng;
          geoRadius = radius ? Number(radius) : 10;
          searchLocation = location;
        }
      } catch (error) {
        console.log('Geocoding failed for:', location, error);
      }
    }

    // Use explicit lat/lng if geocoding didn't produce coordinates
    if (lat && lng && !geoLat && !geoLng) {
      geoLat = Number(lat);
      geoLng = Number(lng);
      geoRadius = radius ? Number(radius) : 10;
    }

    // JSON features filter (SQL-level)
    if (features) {
      const featuresArray = Array.isArray(features) ? features : (features as string).split(',');
      where.features = { [Op.contains]: featuresArray };
    }

    // Haversine distance calculation
    const haversineLiteral = (latVal: number, lngVal: number) =>
      Sequelize.literal(
        `6371 * acos(cos(radians(${latVal})) * cos(radians(lat)) * cos(radians(lng) - radians(${lngVal})) + sin(radians(${latVal})) * sin(radians(lat)))`,
      );

    let attributes: any = undefined;
    let order: any = undefined;

    if (geoLat && geoLng && geoRadius) {
      const distanceLiteral = haversineLiteral(geoLat, geoLng);
      attributes = { include: [[distanceLiteral, 'distance']] };
      order = [[distanceLiteral, 'ASC']];
      if (!where[Op.and]) where[Op.and] = [];
      where[Op.and].push(Sequelize.where(distanceLiteral, { [Op.lte]: geoRadius }));
    } else if (lat && lng && radius) {
      const latitude = Number(lat);
      const longitude = Number(lng);
      const radiusKm = Number(radius);
      const distanceLiteral = haversineLiteral(latitude, longitude);
      attributes = { include: [[distanceLiteral, 'distance']] };
      order = [[distanceLiteral, 'ASC']];
      if (!where[Op.and]) where[Op.and] = [];
      where[Op.and].push(Sequelize.where(distanceLiteral, { [Op.lte]: radiusKm }));
    } else {
      order = [['isFeatured', 'DESC'], ['createdAt', 'DESC']];
    }

    // Includes: author + services
    const include: any[] = [
      {
        model: User as any,
        as: 'author',
        attributes: ['id', 'name', 'profilePhotoUrl', 'isVerified'],
      },
    ];

    if (services) {
      const servicesArray = (Array.isArray(services) ? services : (services as string).split(',')).map(Number);
      include.push({
        model: Service as any,
        as: 'services',
        where: { id: { [Op.in]: servicesArray } },
        through: { attributes: [] },
        required: true,
      });
    } else {
      include.push({
        model: Service as any,
        as: 'services',
        through: { attributes: [] },
        required: false,
      });
    }

    const offset = (Number(page) - 1) * Number(limit);

    const queryOptions: any = {
      where,
      include,
      order: order || [['createdAt', 'DESC']],
    };

    // Distance attribute handling
    if (geoLat && geoLng && geoRadius) {
      queryOptions.attributes = { include: [[haversineLiteral(geoLat, geoLng), 'distance']] };
    } else if (lat && lng && radius) {
      queryOptions.attributes = { include: [[haversineLiteral(Number(lat), Number(lng)), 'distance']] };
    } else {
      queryOptions.attributes = { exclude: [] };
    }

    const allProperties = await (Property as any).findAll(queryOptions);

    // In-memory feature filter (stricter than SQL Op.contains)
    let filteredProperties: any[] = allProperties;
    if (features) {
      const featuresArray = (Array.isArray(features) ? features : String(features).split(',')).map((f) => String(f).trim());
      filteredProperties = filteredProperties.filter((property: any) => {
        const propertyFeatures = (property.features as string[]) || [];
        return featuresArray.every((feature) => propertyFeatures.includes(feature));
      });
    }

    // In-memory distance filter (fallback when SQL literal wasn't applied)
    if (lat && lng && radius) {
      const userLat = Number(lat);
      const userLng = Number(lng);
      const radiusKm = Number(radius);
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
      filteredProperties = filteredProperties.filter((property: any) => {
        const distance = calculateDistance(userLat, userLng, property.lat, property.lng);
        return distance <= radiusKm;
      });
    }

    // Student prioritization: university residences first
    if (userRole === 'estudiante') {
      filteredProperties.sort((a: any, b: any) => {
        const isUniversityA = /residencia|universidad|universitario/i.test(a.title + ' ' + a.description);
        const isUniversityB = /residencia|universidad|universitario/i.test(b.title + ' ' + b.description);
        if (isUniversityA && !isUniversityB) return -1;
        if (!isUniversityA && isUniversityB) return 1;
        return 0;
      });
    }

    const totalCount = filteredProperties.length;
    const paginatedProperties = filteredProperties.slice(offset, offset + Number(limit));

    const result: PropertySearchResult = {
      properties: paginatedProperties,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    };

    if (searchLocation && geoLat && geoLng) {
      result.geocoding = {
        searchLocation,
        coordinates: { lat: geoLat, lng: geoLng },
        radiusKm: geoRadius || 10,
        foundProperties: totalCount,
      };
    }

    return result;
  }

  async createProperty(data: CreatePropertyInput): Promise<Property> {
    const { imagePaths = [], videoPath, ...rest } = data;

    let processedImages: string[] = [];
    let processedVideo: string | undefined;

    if (imagePaths.length > 0) {
      const { processedPaths } = await mediaProcessingService.processImages(imagePaths);
      processedImages = processedPaths.map((p) => mediaProcessingService.toPublicUrl(p));
    }

    if (videoPath) {
      const { videoPath: vp } = await mediaProcessingService.processVideo(videoPath);
      processedVideo = mediaProcessingService.toPublicUrl(vp);
    }

    const property = await Property.create({
      ...rest,
      images: processedImages,
      mainImage: processedImages[0] ?? '',
      status: 'pending',
      views: 0,
      isFeatured: false,
      isVerified: false,
    } as any);

    if (processedVideo) {
      await property.update({ videoUrl: processedVideo } as any);
    }

    return property;
  }

  async publishProperty(propertyId: number, ownerId: number): Promise<Property> {
    const property = await Property.findByPk(propertyId);

    if (!property) throw new Error('Propiedad no encontrada');
    if (property.authorId !== ownerId) throw new Error('No autorizado');
    if (['rented', 'sold'].includes(property.status)) {
      throw new Error('La propiedad no es editable en su estado actual');
    }

    await property.update({ status: 'approved' as PropertyStatus });

    // Notify all students about the new property
    try {
      await notificationInAppService.notifyStudentsNewProperty(property);
    } catch (notifErr) {
      console.error('Error sending new property notifications:', notifErr);
    }

    return property;
  }

  async getOwnerProperties(ownerId: number, page = 1, limit = 12): Promise<{ rows: Property[]; count: number }> {
    const offset = (page - 1) * limit;
    return Property.findAndCountAll({
      where: { authorId: ownerId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      // Asegurar que siempre se incluyan avgRating y reviewCount
      attributes: { exclude: [] } // Esto fuerza a Sequelize a incluir todos los campos del modelo
    });
  }

  async getAllProperties(filters: PropertyFilters): Promise<{ rows: Property[]; count: number }> {
    const {
      search, type, listingType, minPrice, maxPrice,
      bedrooms, bathrooms, furnished, location, city,
      page = 1, limit = 12,
    } = filters;

    const where: WhereOptions<any> = { status: 'approved' };

    if (search) {
      (where as any)[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (type && type !== 'all') (where as any).type = type;
    if (listingType && listingType !== 'all') (where as any).listingType = listingType;
    if (city) (where as any).city = { [Op.iLike]: `%${city}%` };
    if (location) (where as any).location = { [Op.iLike]: `%${location}%` };
    if (furnished !== undefined) (where as any).furnished = furnished;

    if (minPrice || maxPrice) {
      (where as any).price = {};
      if (minPrice) (where as any).price[Op.gte] = minPrice;
      if (maxPrice) (where as any).price[Op.lte] = maxPrice;
    }

    if (bedrooms && bedrooms !== 'all') {
      const bedroomsStr = String(bedrooms);
      (where as any).bedrooms = bedroomsStr === '4+' ? { [Op.gte]: 4 } : Number(bedrooms);
    }
    if (bathrooms) (where as any).bathrooms = bathrooms;

    const offset = (page - 1) * limit;
    return Property.findAndCountAll({
      where,
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset
      // No especificamos attributes, así que se incluirán todos los campos del modelo
    });
  }

  async getPropertyById(propertyId: number, options?: { viewerUserId?: number; sessionId?: string; source?: string; deviceType?: string }): Promise<Property> {
    const property = await Property.findByPk(propertyId);
    if (!property) throw new Error('Propiedad no encontrada');

    const sessionId = options?.sessionId || `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const source = (options?.source as 'search' | 'direct' | 'favorite' | 'recommendation') || 'direct';
    const deviceType = (options?.deviceType as 'desktop' | 'mobile' | 'tablet') || 'desktop';

    // Increment views and create view record in a single transaction
    await sequelize.transaction(async (t) => {
      await property.increment('views', { transaction: t });
      await PropertyView.create({
        propertyId,
        userId: options?.viewerUserId || null,
        sessionId,
        source,
        deviceType,
        timestamp: new Date(),
      } as any, { transaction: t });
    });

    return property;
  }

  async updateProperty(propertyId: number, ownerId: number, data: Partial<PropertyCreationAttributes>): Promise<Property> {
    const property = await Property.findByPk(propertyId);
    if (!property) throw new Error('Propiedad no encontrada');
    if (property.authorId !== ownerId) throw new Error('No autorizado');
    if (['rented', 'sold'].includes(property.status)) {
      throw new Error('La propiedad no es editable en su estado actual');
    }
    await property.update(data);
    return property;
  }

  async deleteProperty(propertyId: number, requesterId: number, requesterRole: string): Promise<void> {
    const property = await Property.findByPk(propertyId);
    if (!property) throw new Error('Propiedad no encontrada');
    if (property.authorId !== requesterId && requesterRole !== 'admin') {
      throw new Error('No autorizado');
    }
    await property.destroy();
  }

  async addToFavorites(userId: number, propertyId: number): Promise<void> {
    const property = await Property.findByPk(propertyId);
    if (!property) throw new Error('Propiedad no encontrada');
    await Favorite.findOrCreate({ where: { userId, propertyId }, defaults: { userId, propertyId } as any });
  }

  async removeFromFavorites(userId: number, propertyId: number): Promise<void> {
    await Favorite.destroy({ where: { userId, propertyId } });
  }

  async getUserFavorites(userId: number): Promise<Property[]> {
    const favorites = await Favorite.findAll({
      where: { userId },
      include: [{ model: Property, as: 'property' }],
    });
    return favorites.map((f: any) => f.property).filter(Boolean);
  }
}

export const propertyService = new PropertyService();
