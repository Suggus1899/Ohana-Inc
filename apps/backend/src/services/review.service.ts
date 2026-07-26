import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { PropertyReview, UserReview, Property, User, RentalRequest, Transaction } from '../models';
import { ApiResponse, ErrorCodes } from '../types';

export class ReviewService {
  
  // ======================
  // PROPERTY REVIEWS
  // ======================

  /**
   * Crear review de propiedad
   */
  public async createPropertyReview(
    userId: number,
    propertyId: number,
    rating: number,
    comment?: string,
    rentRequestId?: number
  ): Promise<ApiResponse<{ review: PropertyReview }>> {
    try {
      // Validar rating
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'El rating debe estar entre 1 y 5'
          }
        };
      }

      // Verificar que la propiedad existe
      const property = await Property.findByPk(propertyId);
      if (!property) {
        return {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Propiedad no encontrada'
          }
        };
      }

      // Verificar que el usuario existe y es cliente/estudiante
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Usuario no encontrado'
          }
        };
      }

      if (user.role !== 'cliente' && user.role !== 'estudiante') {
        return {
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: 'Solo clientes y estudiantes pueden calificar propiedades'
          }
        };
      }

      // REGLA FUNDAMENTAL: Verificar que el usuario tuvo un RentalRequest COMPLETADO con esta propiedad
      // Este es el requisito obligatorio para poder calificar una propiedad.
      const completedRentRequest = await RentalRequest.findOne({
        where: {
          tenantId: userId,
          propertyId,
          status: 'completed'
        }
      });

      if (!completedRentRequest) {
        return {
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: 'Solo puedes calificar propiedades en las que hayas completado un alquiler'
          }
        };
      }

      // Si se proporciona rentRequestId explícito, verificar que coincida con el usuario
      if (rentRequestId && rentRequestId !== completedRentRequest.id) {
        const specifiedRequest = await RentalRequest.findByPk(rentRequestId);
        if (!specifiedRequest || specifiedRequest.tenantId !== userId || specifiedRequest.status !== 'completed') {
          return {
            success: false,
            error: {
              code: ErrorCodes.VALIDATION_ERROR,
              message: 'La solicitud de alquiler especificada no es válida'
            }
          };
        }
      }

      // Usar el rentRequestId del request completado encontrado (si no se especificó uno)
      const resolvedRentRequestId = rentRequestId || completedRentRequest.id;

      // Verificar que no haya review previo del mismo usuario para la misma propiedad
      const existingReview = await PropertyReview.findOne({
        where: { propertyId, userId }
      });

      if (existingReview) {
        return {
          success: false,
          error: {
            code: ErrorCodes.DUPLICATE_ENTRY,
            message: 'Ya has calificado esta propiedad'
          }
        };
      }

      // Crear el review de propiedad y actualizar cache en una transacción
      const review = await sequelize.transaction(async (t) => {
        const created = await PropertyReview.create({
          propertyId,
          userId,
          rating,
          comment,
          rentRequestId: resolvedRentRequestId
        }, { transaction: t });

        await this._updatePropertyRatingCache(propertyId, t);
        return created;
      });

      return {
        success: true,
        data: { review }
      };

    } catch (error: any) {
      console.error('Error creating property review:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.CREATE_ERROR,
          message: error.message || 'Error al crear la reseña'
        }
      };
    }
  }

  /**
   * Obtener reviews de una propiedad (paginated)
   */
  public async getPropertyReviews(
    propertyId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<{ 
    reviews: PropertyReview[];
    pagination: { page: number; limit: number; total: number; pages: number };
    avgRating: number;
    reviewCount: number;
  }>> {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await PropertyReview.findAndCountAll({
        where: { propertyId },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'profilePhotoUrl', 'isVerified']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      // Obtener información de la propiedad para el cache
      const property = await Property.findByPk(propertyId);
      const avgRating = (property as any)?.avgRating || 0;
      const reviewCount = (property as any)?.reviewCount || 0;

      return {
        success: true,
        data: {
          reviews: rows,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit)
          },
          avgRating,
          reviewCount
        }
      };

    } catch (error: any) {
      console.error('Error getting property reviews:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.FETCH_ERROR,
          message: error.message || 'Error al obtener reseñas'
        }
      };
    }
  }

  /**
   * Obtener reviews de todas las propiedades de un propietario (paginated)
   */
  public async getOwnerPropertiesReviews(
    ownerId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<{ 
    reviews: PropertyReview[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>> {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await PropertyReview.findAndCountAll({
        include: [
          {
            model: Property,
            as: 'property',
            where: { authorId: ownerId },
            attributes: ['id', 'title', 'mainImage']
          },
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'profilePhotoUrl', 'isVerified']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        success: true,
        data: {
          reviews: rows,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      };

    } catch (error: any) {
      console.error('Error getting owner properties reviews:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.FETCH_ERROR,
          message: error.message || 'Error al obtener reseñas de propiedades'
        }
      };
    }
  }

  /**
   * Obtener el review del usuario para una propiedad
   */
  public async getMyPropertyReview(
    userId: number,
    propertyId: number
  ): Promise<ApiResponse<{ review: PropertyReview | null }>> {
    try {
      const review = await PropertyReview.findOne({
        where: { propertyId, userId }
      });

      return {
        success: true,
        data: { review }
      };

    } catch (error: any) {
      console.error('Error getting my property review:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.FETCH_ERROR,
          message: error.message || 'Error al obtener tu reseña'
        }
      };
    }
  }

  /**
   * Actualizar review de propiedad
   */
  public async updatePropertyReview(
    reviewId: number,
    userId: number,
    rating: number,
    comment?: string
  ): Promise<ApiResponse<{ review: PropertyReview }>> {
    try {
      // Validar rating
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'El rating debe estar entre 1 y 5'
          }
        };
      }

      // Encontrar el review
      const review = await PropertyReview.findByPk(reviewId);
      if (!review) {
        return {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Reseña no encontrada'
          }
        };
      }

      // Verificar que el usuario es el autor
      if (review.userId !== userId) {
        return {
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: 'No tienes permiso para actualizar esta reseña'
          }
        };
      }

      // Actualizar el review y cache en una transacción
      await sequelize.transaction(async (t) => {
        await review.update({ rating, comment }, { transaction: t });
        await this._updatePropertyRatingCache(review.propertyId, t);
      });

      return {
        success: true,
        data: { review }
      };

    } catch (error: any) {
      console.error('Error updating property review:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.UPDATE_ERROR,
          message: error.message || 'Error al actualizar la reseña'
        }
      };
    }
  }

  /**
   * Eliminar review de propiedad
   */
  public async deletePropertyReview(
    reviewId: number,
    userId: number
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      // Encontrar el review
      const review = await PropertyReview.findByPk(reviewId);
      if (!review) {
        return {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Reseña no encontrada'
          }
        };
      }

      // Verificar que el usuario es el autor o es admin
      const user = await User.findByPk(userId);
      const isAuthor = review.userId === userId;
      const isAdmin = user?.role === 'admin';

      if (!isAuthor && !isAdmin) {
        return {
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: 'No tienes permiso para eliminar esta reseña'
          }
        };
      }

      const propertyId = review.propertyId;
      await sequelize.transaction(async (t) => {
        await review.destroy({ transaction: t });
        await this._updatePropertyRatingCache(propertyId, t);
      });

      return {
        success: true,
        data: { message: 'Reseña eliminada correctamente' }
      };

    } catch (error: any) {
      console.error('Error deleting property review:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.DELETE_ERROR,
          message: error.message || 'Error al eliminar la reseña'
        }
      };
    }
  }

  // ======================
  // USER REVIEWS
  // ======================

  /**
   * Crear review de usuario
   */
  public async createUserReview(
    reviewerId: number,
    reviewedId: number,
    rating: number,
    comment?: string,
    transactionId?: number
  ): Promise<ApiResponse<{ review: UserReview }>> {
    try {
      // Validar rating
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'El rating debe estar entre 1 y 5'
          }
        };
      }

      // No permitir auto-review
      if (reviewerId === reviewedId) {
        return {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'No puedes calificarte a ti mismo'
          }
        };
      }

      // Verificar que ambos usuarios existen
      const reviewer = await User.findByPk(reviewerId);
      const reviewed = await User.findByPk(reviewedId);

      if (!reviewer || !reviewed) {
        return {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Uno o ambos usuarios no existen'
          }
        };
      }

      // Validar roles (debe ser cliente/estudiante ↔ propietario)
      const isReviewerClient = reviewer.role === 'cliente' || reviewer.role === 'estudiante';
      const isReviewerOwner = reviewer.role === 'propietario';
      const isReviewedClient = reviewed.role === 'cliente' || reviewed.role === 'estudiante';
      const isReviewedOwner = reviewed.role === 'propietario';

      if (!((isReviewerClient && isReviewedOwner) || (isReviewerOwner && isReviewedClient))) {
        return {
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: 'Las calificaciones de usuario solo son válidas entre clientes/estudiantes y propietarios'
          }
        };
      }

      // Verificar que no haya review previo entre estos usuarios
      const existingReview = await UserReview.findOne({
        where: { reviewerId, reviewedId }
      });

      if (existingReview) {
        return {
          success: false,
          error: {
            code: ErrorCodes.DUPLICATE_ENTRY,
            message: 'Ya has calificado a este usuario'
          }
        };
      }

      // REGLA FUNDAMENTAL: Verificar que existe una Transaction COMPLETADA entre ambos usuarios.
      // Este es el requisito obligatorio para poder calificarse mutuamente.
      // Se acepta que reviewer sea cliente o propietario en la transacción.
      const transactionBetweenUsers = await Transaction.findOne({
        where: {
          status: 'completed',
          [Op.or]: [
            { clientId: reviewerId, ownerId: reviewedId },
            { clientId: reviewedId, ownerId: reviewerId }
          ]
        }
      });

      if (!transactionBetweenUsers) {
        return {
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: 'Solo puedes calificar a usuarios con los que hayas completado una transacción'
          }
        };
      }

      // Si se proporciona transactionId explícito, verificar que sea válido
      if (transactionId) {
        const specifiedTransaction = await Transaction.findByPk(transactionId);
        if (!specifiedTransaction || specifiedTransaction.status !== 'completed') {
          return {
            success: false,
            error: {
              code: ErrorCodes.VALIDATION_ERROR,
              message: 'La transacción especificada no es válida o no está completada'
            }
          };
        }

        // Verificar que ambos usuarios están en la transacción especificada
        const isReviewerInTransaction =
          specifiedTransaction.clientId === reviewerId || specifiedTransaction.ownerId === reviewerId;
        const isReviewedInTransaction =
          specifiedTransaction.clientId === reviewedId || specifiedTransaction.ownerId === reviewedId;

        if (!isReviewerInTransaction || !isReviewedInTransaction) {
          return {
            success: false,
            error: {
              code: ErrorCodes.FORBIDDEN,
              message: 'Ambos usuarios deben estar involucrados en la transacción especificada'
            }
          };
        }
      }

      // Usar el transactionId de la transacción completada (si no se especificó uno)
      const resolvedTransactionId = transactionId || transactionBetweenUsers.id;

      // Crear el review y actualizar cache en una transacción
      const review = await sequelize.transaction(async (t) => {
        const created = await UserReview.create({
          reviewerId,
          reviewedId,
          rating,
          comment,
          transactionId: resolvedTransactionId
        }, { transaction: t });

        await this._updateUserRatingCache(reviewedId, t);
        return created;
      });

      return {
        success: true,
        data: { review }
      };

    } catch (error: any) {
      console.error('Error creating user review:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.CREATE_ERROR,
          message: error.message || 'Error al crear la reseña'
        }
      };
    }
  }

  /**
   * Obtener reviews recibidos por un usuario
   */
  public async getUserReviews(
    userId: number,
    role?: 'owner' | 'tenant',
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<{ 
    reviews: UserReview[];
    pagination: { page: number; limit: number; total: number; pages: number };
    avgRatingAsOwner: number;
    reviewCountAsOwner: number;
    avgRatingAsTenant: number;
    reviewCountAsTenant: number;
  }>> {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause: any = { reviewedId: userId };
      
      // Filtrar por rol si se especifica
      if (role === 'owner') {
        whereClause = { 
          ...whereClause,
          reviewedId: userId,
          '$reviewer.role$': { [Op.in]: ['cliente', 'estudiante'] }
        };
      } else if (role === 'tenant') {
        whereClause = { 
          ...whereClause,
          reviewedId: userId,
          '$reviewer.role$': 'propietario'
        };
      }

      const { count, rows } = await UserReview.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'name', 'profilePhotoUrl', 'role', 'isVerified']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      // Obtener información del usuario para el cache
      const user = await User.findByPk(userId);
      const avgRatingAsOwner = (user as any)?.avgRatingAsOwner || 0;
      const reviewCountAsOwner = (user as any)?.reviewCountAsOwner || 0;
      const avgRatingAsTenant = (user as any)?.avgRatingAsTenant || 0;
      const reviewCountAsTenant = (user as any)?.reviewCountAsTenant || 0;

      return {
        success: true,
        data: {
          reviews: rows,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit)
          },
          avgRatingAsOwner,
          reviewCountAsOwner,
          avgRatingAsTenant,
          reviewCountAsTenant
        }
      };

    } catch (error: any) {
      console.error('Error getting user reviews:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.FETCH_ERROR,
          message: error.message || 'Error al obtener reseñas'
        }
      };
    }
  }

  /**
   * Obtener review entre dos usuarios
   */
  public async getUserReviewBetween(
    reviewerId: number,
    reviewedId: number
  ): Promise<ApiResponse<{ review: UserReview | null }>> {
    try {
      const review = await UserReview.findOne({
        where: { reviewerId, reviewedId }
      });

      return {
        success: true,
        data: { review }
      };

    } catch (error: any) {
      console.error('Error getting user review between:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.FETCH_ERROR,
          message: error.message || 'Error al obtener reseña entre usuarios'
        }
      };
    }
  }

  /**
   * Actualizar review de usuario
   */
  public async updateUserReview(
    reviewId: number,
    reviewerId: number,
    rating: number,
    comment?: string
  ): Promise<ApiResponse<{ review: UserReview }>> {
    try {
      // Validar rating
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'El rating debe estar entre 1 y 5'
          }
        };
      }

      // Encontrar el review
      const review = await UserReview.findByPk(reviewId);
      if (!review) {
        return {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Reseña no encontrada'
          }
        };
      }

      // Verificar que el usuario es el reviewer
      if (review.reviewerId !== reviewerId) {
        return {
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: 'No tienes permiso para actualizar esta reseña'
          }
        };
      }

      // Actualizar el review y cache en una transacción
      await sequelize.transaction(async (t) => {
        await review.update({ rating, comment }, { transaction: t });
        await this._updateUserRatingCache(review.reviewedId, t);
      });

      return {
        success: true,
        data: { review }
      };

    } catch (error: any) {
      console.error('Error updating user review:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.UPDATE_ERROR,
          message: error.message || 'Error al actualizar la reseña'
        }
      };
    }
  }

  /**
   * Eliminar review de usuario
   */
  public async deleteUserReview(
    reviewId: number,
    reviewerId: number
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      // Encontrar el review
      const review = await UserReview.findByPk(reviewId);
      if (!review) {
        return {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Reseña no encontrada'
          }
        };
      }

      // Verificar que el usuario es el reviewer o es admin
      const user = await User.findByPk(reviewerId);
      const isReviewer = review.reviewerId === reviewerId;
      const isAdmin = user?.role === 'admin';

      if (!isReviewer && !isAdmin) {
        return {
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: 'No tienes permiso para eliminar esta reseña'
          }
        };
      }

      const reviewedId = review.reviewedId;
      await sequelize.transaction(async (t) => {
        await review.destroy({ transaction: t });
        await this._updateUserRatingCache(reviewedId, t);
      });

      return {
        success: true,
        data: { message: 'Reseña eliminada correctamente' }
      };

    } catch (error: any) {
      console.error('Error deleting user review:', error);
      return {
        success: false,
        error: {
          code: ErrorCodes.DELETE_ERROR,
          message: error.message || 'Error al eliminar la reseña'
        }
      };
    }
  }

  // ======================
  // PRIVATE METHODS (CACHE UPDATES)
  // ======================

  /**
   * Actualizar cache de ratings de propiedad
   */
  private async _updatePropertyRatingCache(propertyId: number, transaction?: any): Promise<void> {
    try {
      const result = await PropertyReview.findAll({
        where: { propertyId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
        ],
        raw: true,
        transaction,
      });

      const aggResult = result[0] as any;

      const avgRating = aggResult && aggResult.avgRating !== null ? 
        (typeof aggResult.avgRating === 'string' ? parseFloat(aggResult.avgRating) : aggResult.avgRating) : 0;
      
      const reviewCount = aggResult && aggResult.reviewCount !== null ? 
        (typeof aggResult.reviewCount === 'string' ? parseInt(aggResult.reviewCount, 10) : aggResult.reviewCount) : 0;

      await Property.update(
        {
          avgRating,
          reviewCount
        },
        { where: { id: propertyId }, transaction }
      );

    } catch (error) {
      console.error('Error updating property rating cache:', error);
    }
  }

  /**
   * Actualizar cache de ratings de usuario
   */
  private async _updateUserRatingCache(userId: number, transaction?: any): Promise<void> {
    try {
      // Reviews como owner (cuando el usuario es propietario y es calificado por clientes/estudiantes)
      const [ownerReviewsRaw] = await sequelize.query(
        `SELECT AVG(ur.rating) as avgRating, COUNT(ur.id) as reviewCount
         FROM user_reviews ur
         JOIN users u ON ur."reviewerId" = u.id
         WHERE ur."reviewedId" = ? AND u.role IN ('cliente', 'estudiante')`,
        { replacements: [userId], transaction }
      );

      const ownerAggResult = (ownerReviewsRaw as any[])[0] as any;
      
      const avgRatingAsOwner = ownerAggResult && ownerAggResult.avgrating !== null ? 
        (typeof ownerAggResult.avgrating === 'string' ? parseFloat(ownerAggResult.avgrating) : ownerAggResult.avgrating) : 0;
      
      const reviewCountAsOwner = ownerAggResult && ownerAggResult.reviewcount !== null ? 
        (typeof ownerAggResult.reviewcount === 'string' ? parseInt(ownerAggResult.reviewcount, 10) : ownerAggResult.reviewcount) : 0;

      // Reviews como tenant (cuando el usuario es cliente/estudiante y es calificado por propietarios)
      const [tenantReviewsRaw] = await sequelize.query(
        `SELECT AVG(ur.rating) as avgRating, COUNT(ur.id) as reviewCount
         FROM user_reviews ur
         JOIN users u ON ur."reviewerId" = u.id
         WHERE ur."reviewedId" = ? AND u.role = 'propietario'`,
        { replacements: [userId], transaction }
      );

      const tenantAggResult = (tenantReviewsRaw as any[])[0] as any;
      
      const avgRatingAsTenant = tenantAggResult && tenantAggResult.avgrating !== null ? 
        (typeof tenantAggResult.avgrating === 'string' ? parseFloat(tenantAggResult.avgrating) : tenantAggResult.avgrating) : 0;
      
      const reviewCountAsTenant = tenantAggResult && tenantAggResult.reviewcount !== null ? 
        (typeof tenantAggResult.reviewcount === 'string' ? parseInt(tenantAggResult.reviewcount, 10) : tenantAggResult.reviewcount) : 0;

      await User.update(
        {
          avgRatingAsOwner,
          reviewCountAsOwner,
          avgRatingAsTenant,
          reviewCountAsTenant
        },
        { where: { id: userId }, transaction }
      );

    } catch (error) {
      console.error('Error updating user rating cache:', error);
    }
  }
}