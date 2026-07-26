import { Op, WhereOptions } from 'sequelize';
import Property from '../models/Property';
import Favorite from '../models/Favorite';
import PropertyView from '../models/PropertyView';
import { mediaProcessingService } from './media-processing.service';
import { PropertyCreationAttributes, PropertyStatus } from '../types';
import { notificationInAppService } from './notification-inapp.service';
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

export interface CreatePropertyInput extends Omit<PropertyCreationAttributes, 'images' | 'mainImage' | 'status' | 'isVerified' | 'isFeatured' | 'views'> {
  imagePaths?: string[];
  videoPath?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  views?: number;
}

export class PropertyService {
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
