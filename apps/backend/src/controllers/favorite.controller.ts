import { Response } from 'express';
import { Favorite, Property, User } from '../models';
import { AuthRequest } from '../types';

export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { propertyId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const existing = await Favorite.findOne({ where: { userId, propertyId } });

    if (existing) {
      await existing.destroy();
      return res.json({ success: true, message: 'Property removed from favorites', data: { isFavorite: false } });
    }

    const favorite = await Favorite.create({ userId, propertyId });

    return res.status(201).json({ success: true, message: 'Property added to favorites', data: { favorite, isFavorite: true } });
  } catch (error: any) {
    console.error('Toggle favorite error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const favorites = await Favorite.findAll({
      where: { userId },
      include: [
        {
          model: Property,
          as: 'property',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'profilePhotoUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, data: { favorites } });
  } catch (error: any) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Alias for routes that import getUserFavorites
export const getUserFavorites = getFavorites;
