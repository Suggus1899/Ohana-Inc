import { Response } from 'express';
import { AuthRequest } from '../types';
import { ReviewService } from '../services/review.service';

const reviewService = new ReviewService();

// ======================
// PROPERTY REVIEWS
// ======================

export const createPropertyReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
    }

    const { propertyId, rating, comment, rentRequestId } = req.body;

    if (!propertyId || !rating) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'propertyId y rating son requeridos' }
      });
    }

    const result = await reviewService.createPropertyReview(
      userId,
      propertyId,
      rating,
      comment,
      rentRequestId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Error in createPropertyReview:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};

export const getPropertyReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'propertyId es requerido' }
      });
    }

    const result = await reviewService.getPropertyReviews(
      parseInt(propertyId),
      page,
      limit
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in getPropertyReviews:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};

export const getMyPropertyReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { propertyId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
    }

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'propertyId es requerido' }
      });
    }

    const result = await reviewService.getMyPropertyReview(
      userId,
      parseInt(propertyId)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in getMyPropertyReview:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};

export const updatePropertyReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
    }

    if (!rating) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'rating es requerido' }
      });
    }

    const result = await reviewService.updatePropertyReview(
      parseInt(id),
      userId,
      rating,
      comment
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in updatePropertyReview:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};

export const deletePropertyReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
    }

    const result = await reviewService.deletePropertyReview(
      parseInt(id),
      userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in deletePropertyReview:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};

// ======================
// USER REVIEWS
// ======================

export const createUserReview = async (req: AuthRequest, res: Response) => {
  try {
    const reviewerId = req.user?.userId;
    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
    }

    const { reviewedId, rating, comment, transactionId } = req.body;

    if (!reviewedId || !rating) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'reviewedId y rating son requeridos' }
      });
    }

    const result = await reviewService.createUserReview(
      reviewerId,
      reviewedId,
      rating,
      comment,
      transactionId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Error in createUserReview:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};

export const getUserReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const role = req.query.role as 'owner' | 'tenant';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId es requerido' }
      });
    }

    const result = await reviewService.getUserReviews(
      parseInt(userId),
      role,
      page,
      limit
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in getUserReviews:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};

export const getUserReviewBetween = async (req: AuthRequest, res: Response) => {
  try {
    const reviewerId = req.user?.userId;
    const { userId } = req.params;

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId es requerido' }
      });
    }

    const result = await reviewService.getUserReviewBetween(
      reviewerId,
      parseInt(userId)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in getUserReviewBetween:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};

export const updateUserReview = async (req: AuthRequest, res: Response) => {
  try {
    const reviewerId = req.user?.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
    }

    if (!rating) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'rating es requerido' }
      });
    }

    const result = await reviewService.updateUserReview(
      parseInt(id),
      reviewerId,
      rating,
      comment
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in updateUserReview:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};

export const deleteUserReview = async (req: AuthRequest, res: Response) => {
  try {
    const reviewerId = req.user?.userId;
    const { id } = req.params;

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
    }

    const result = await reviewService.deleteUserReview(
      parseInt(id),
      reviewerId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in deleteUserReview:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};

export const getOwnerPropertiesReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { ownerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'ownerId es requerido' }
      });
    }

    const result = await reviewService.getOwnerPropertiesReviews(
      parseInt(ownerId),
      page,
      limit
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in getOwnerPropertiesReviews:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Error interno del servidor' }
    });
  }
};