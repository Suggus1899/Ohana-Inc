import { Response, NextFunction } from 'express';
import multer from 'multer';
import { KYCService } from '../services/kyc.service';
import { DocumentType } from '../models/KYCDocument';
import { ApiResponse, ErrorCodes, AuthRequest } from '../types';
import KYCVerification from '../models/KYCVerification';
import KYCDocument from '../models/KYCDocument';
import KYCAttempt from '../models/KYCAttempt';
import User from '../models/User';
import { EncryptionService } from '../services/encryption.service';
import { StorageService } from '../services/storage.service';
import { 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError, 
  NotFoundError,
  ProcessingError 
} from '../middleware/error.middleware';
import { auditLogger } from '../services/audit-logger.service';
import { MetricsService } from '../services/metrics.service';

const kycService = new KYCService();
const metricsService = new MetricsService();

// Configurar multer para multipart/form-data (Requisito 22.14)
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo permitidos
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'video/webm',
      'video/mp4'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no válido. Solo se permiten imágenes JPEG/PNG y videos WebM/MP4.'));
    }
  }
});

/**
 * Inicia una nueva verificación KYC para el usuario autenticado
 * 
 * @route POST /api/kyc/start
 * @access Autenticado (JWT)
 * 
 * Requisitos: 3.1-3.7, 22.1
 */
export async function startVerification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const userId = req.user.userId;
    const { consentedAt } = req.body;

    // Llamar KYCService.createVerification con consentedAt (Requisito 31.5)
    const verification = await kycService.createVerification(
      userId, 
      consentedAt ? new Date(consentedAt) : undefined
    );

    const response: ApiResponse = {
      success: true,
      data: {
        verificationId: verification.id,
        status: verification.status,
        currentStep: 'document_capture'
      }
    };
    res.status(201).json(response);
  } catch (error: any) {
    // Manejar error de límite de intentos excedido (Requisito 3.5, 3.6)
    if (error.message && error.message.includes('Maximum of 3 verification attempts')) {
      return next(new AuthorizationError('Has excedido el límite de 3 intentos de verificación en 30 días. Por favor, contacta al soporte.'));
    }

    // Manejar error de verificación activa existente (Requisito 3.2)
    if (error.message && error.message.includes('already has an active verification')) {
      return next(new ValidationError('Ya tienes una verificación en progreso. Por favor, completa la verificación actual antes de iniciar una nueva.'));
    }

    // Manejar error de usuario ya verificado
    if (error.message && error.message.includes('User is already verified')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Tu identidad ya está verificada. No necesitas iniciar una nueva verificación.'
        }
      };
      res.status(200).json(response);
      return;
    }

    // Delegar al manejador de errores centralizado
    next(error);
  }
}

/**
 * Sube un documento de verificación
 * 
 * @route POST /api/kyc/upload
 * @access Autenticado (JWT)
 * 
 * Requisitos: 4.1-4.12, 22.2, 22.14
 */
export async function uploadDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validar autenticación JWT (Requisito 22.2)
    if (!req.user) {
      throw new AuthenticationError();
    }

    // Validar campos requeridos: verificationId, documentType, file (Requisito 22.2)
    const { verificationId, documentType } = req.body;
    const file = req.file;

    if (!verificationId) {
      throw new ValidationError('El campo verificationId es obligatorio');
    }

    if (!documentType) {
      throw new ValidationError('El campo documentType es obligatorio');
    }

    if (!file) {
      throw new ValidationError('El archivo es obligatorio');
    }

    // Validar que documentType sea uno de los 6 valores válidos (Requisito 22.2)
    const validDocumentTypes: DocumentType[] = [
      'id_front',
      'id_back',
      'selfie',
      'selfie_with_doc',
      'liveness_video',
      'proof_of_address'
    ];

    if (!validDocumentTypes.includes(documentType as DocumentType)) {
      throw new ValidationError(`documentType debe ser uno de: ${validDocumentTypes.join(', ')}`);
    }

    // Llamar KYCService.uploadDocument (Requisito 22.2)
    const document = await kycService.uploadDocument(
      parseInt(verificationId, 10),
      documentType as DocumentType,
      file.buffer
    );

    // Retornar respuesta exitosa (Requisito 22.2)
    const response: ApiResponse = {
      success: true,
      data: {
        documentId: document.id,
        url: document.url,
        fileHash: document.fileHash
      }
    };
    res.status(201).json(response);
  } catch (error: any) {
    // Manejar error de verificación no encontrada
    if (error.message && error.message.includes('not found')) {
      return next(new NotFoundError('Verificación no encontrada'));
    }

    // Manejar error de archivo muy grande (Requisito 22.2)
    if (error.message && error.message.includes('File too large')) {
      return next(new ValidationError('El archivo es muy grande. Tamaño máximo: 10MB'));
    }

    // Manejar error de tipo de archivo inválido (Requisito 22.2)
    if (error.message && error.message.includes('Tipo de archivo no válido')) {
      return next(new ValidationError(error.message));
    }

    // Delegar al manejador de errores centralizado
    next(error);
  }
}

/**
 * Procesa una verificación KYC completa
 * 
 * @route POST /api/kyc/process/:verificationId
 * @access Autenticado (JWT)
 * 
 * Requisitos: 5.1-5.13, 9.1-9.14, 11.1-11.10, 22.3
 */
export async function processVerification(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Validar autenticación JWT (Requisito 22.3)
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      };
      res.status(401).json(response);
      return;
    }

    const userId = req.user.userId;
    const verificationId = parseInt(req.params.verificationId, 10);

    // Validar que verificationId sea un número válido
    if (isNaN(verificationId)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'ID de verificación inválido'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Validar que verificationId pertenezca al usuario autenticado (Requisito 22.3)
    const verification = await kycService.getVerificationById(verificationId);
    
    if (!verification) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      };
      res.status(404).json(response);
      return;
    }

    if (verification.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'No tienes permiso para procesar esta verificación'
        }
      };
      res.status(403).json(response);
      return;
    }

    // Llamar KYCService.processVerification (Requisito 22.3)
    const result = await kycService.processVerification(verificationId);

    // Retornar respuesta (Requisito 22.3)
    const response: ApiResponse = {
      success: result.success,
      data: result.success ? {
        status: result.status,
        ocrData: result.ocrData,
        scores: {
          faceMatch: result.faceMatchScore,
          liveness: result.livenessScore,
          documentValidity: result.documentValidityScore,
          fraud: result.fraudScore
        }
      } : undefined,
      error: !result.success ? {
        code: ErrorCodes.INTERNAL_ERROR,
        message: result.errors?.[0] || 'El procesamiento de la verificación falló. Por favor, intenta nuevamente.'
      } : undefined
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Process verification error:', error);

    // Manejar error de documentos incompletos (Requisito 22.3)
    if (error.message && error.message.includes('Missing required document')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Documentos incompletos. Por favor, sube todos los documentos requeridos antes de procesar.'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Manejar error de verificación no encontrada
    if (error.message && error.message.includes('not found')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      };
      res.status(404).json(response);
      return;
    }

    // Manejar error de procesamiento fallido (Requisito 22.3)
    if (error.message && error.message.includes('Processing failed')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'El procesamiento de la verificación falló. Por favor, intenta nuevamente.'
        }
      };
      res.status(422).json(response);
      return;
    }

    // Error genérico
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Ocurrió un error al procesar la verificación. Por favor, intenta nuevamente en unos momentos.'
      }
    };
    res.status(500).json(response);
  }
}

/**
 * Obtiene el estado de verificación del usuario autenticado
 * 
 * @route GET /api/kyc/status
 * @access Autenticado (JWT)
 * 
 * Requisitos: 22.4
 */
export async function getVerificationStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Validar autenticación JWT (Requisito 22.4)
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      };
      res.status(401).json(response);
      return;
    }

    const userId = req.user.userId;

    // Llamar KYCService.getVerificationByUserId (Requisito 22.4)
    const verification = await kycService.getVerificationByUserId(userId);

    // Retornar estructura explícita si no existe verificación (Bug Fix 1.6)
    if (!verification) {
      const response: ApiResponse = {
        success: true,
        data: {
          verificationId: null,
          status: 'not_started',
          verificationLevel: 0,
          currentLevel: 0,
          createdAt: null,
          updatedAt: null,
          expiresAt: null
        }
      };
      res.status(200).json(response);
      return;
    }

    // Validar que todos los campos requeridos estén presentes (Bug Fix 1.6)
    if (verification.id === undefined || 
        verification.status === undefined || 
        verification.verificationLevel === undefined ||
        verification.currentLevel === undefined ||
        verification.createdAt === undefined ||
        verification.updatedAt === undefined) {
      console.error('Verification missing required fields:', {
        userId,
        verificationId: verification.id,
        hasStatus: verification.status !== undefined,
        hasVerificationLevel: verification.verificationLevel !== undefined,
        hasCurrentLevel: verification.currentLevel !== undefined,
        hasCreatedAt: verification.createdAt !== undefined,
        hasUpdatedAt: verification.updatedAt !== undefined
      });
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Datos de verificación incompletos. Por favor, intenta nuevamente.'
        }
      };
      res.status(500).json(response);
      return;
    }

    // Retornar datos de verificación con estructura consistente (Bug Fix 1.6)
    const response: ApiResponse = {
      success: true,
      data: {
        verificationId: verification.id,
        status: verification.status,
        verificationLevel: verification.verificationLevel,
        currentLevel: verification.currentLevel,
        createdAt: verification.createdAt,
        updatedAt: verification.updatedAt,
        expiresAt: verification.expiresAt || null
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get verification status error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });

    // Error genérico con logging mejorado (Bug Fix 1.6)
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Ocurrió un error al obtener el estado de verificación. Por favor, intenta nuevamente.'
      }
    };
    res.status(500).json(response);
  }
}

/**
 * Decrypts and serves a KYC document
 * 
 * @route GET /api/kyc/admin/documents/:documentId/view
 * @access Operator only
 */
export async function viewDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const { documentId } = req.params;

    const document = await KYCDocument.findByPk(documentId, {
      include: [{ model: KYCVerification, as: 'verification' }]
    });
    if (!document) {
      throw new NotFoundError('Documento no encontrado');
    }

    // Get userId through the verification relationship
    const verification = await KYCVerification.findByPk(document.verificationId);
    if (!verification) {
      throw new NotFoundError('Verificación no encontrada');
    }
    
    await kycService.logDocumentAccess(req.user!.userId, verification.userId, document.documentType);

    const storageService = new StorageService();
    const encryptionService = new EncryptionService();
    
    const encryptedBuffer = await storageService.get(document.encryptedUrl);
    
    const metadata = document.metadata || {};
    const encryptedData = {
      encrypted: encryptedBuffer,
      iv: Buffer.from(metadata.iv || '', 'hex'),
      authTag: Buffer.from(metadata.authTag || '', 'hex')
    };
    
    const decryptedBuffer = encryptionService.decrypt(encryptedData);
    
    const mimeType = document.documentType === 'liveness_video' ? 'video/webm' : 'image/jpeg';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.documentType}.${mimeType.split('/')[1]}"`);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(decryptedBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Obtiene lista de verificaciones pendientes con filtros y paginación
 * 
 * @route GET /api/kyc/admin/pending
 * @access Operador (JWT + rol 'operator')
 * 
 * Requisitos: 13.1-13.16, 22.5
 */
export async function getPendingVerifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Validar autenticación JWT (Requisito 22.5)
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      };
      res.status(401).json(response);
      return;
    }

    // Validar que usuario tenga rol 'operator' o 'admin' (Requisito 22.5)
    if (req.user.role !== 'operator' && req.user.role !== 'admin') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'No tienes permisos para acceder a este recurso. Se requiere rol de operador o administrador.'
        }
      };
      res.status(403).json(response);
      return;
    }

    // Extraer query params (Requisito 22.5)
    const {
      status,
      dateFrom,
      dateTo,
      fraudScoreMin,
      fraudScoreMax,
      page = '1',
      limit = '10'
    } = req.query;

    // Construir filtros
    const filters: any = {};

    if (status && typeof status === 'string') {
      filters.status = status;
    }

    if (dateFrom && typeof dateFrom === 'string') {
      filters.dateFrom = new Date(dateFrom);
    }

    if (dateTo && typeof dateTo === 'string') {
      filters.dateTo = new Date(dateTo);
    }

    if (fraudScoreMin && typeof fraudScoreMin === 'string') {
      const parsedMin = parseFloat(fraudScoreMin);
      if (!isNaN(parsedMin)) {
        filters.fraudScoreMin = parsedMin;
      }
    }

    if (fraudScoreMax && typeof fraudScoreMax === 'string') {
      const parsedMax = parseFloat(fraudScoreMax);
      if (!isNaN(parsedMax)) {
        filters.fraudScoreMax = parsedMax;
      }
    }

    // Parsear paginación
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'El parámetro page debe ser un número mayor a 0'
        }
      };
      res.status(400).json(response);
      return;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'El parámetro limit debe ser un número entre 1 y 100'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Llamar KYCService.getPendingVerifications (Requisito 22.5)
    const allVerifications = await kycService.getPendingVerifications(filters);

    // Implementar paginación (Requisito 22.5)
    const total = allVerifications.length;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedVerifications = allVerifications.slice(startIndex, endIndex);

    // Mapear verificaciones con datos planos del usuario (Bug Fix 2.1)
    const mappedVerifications = paginatedVerifications.map(v => {
      const user = (v as any).user;
      return {
        id: v.id,
        userId: v.userId,
        status: v.status,
        verificationLevel: v.verificationLevel,
        fullName: v.fullName || user?.name || 'Sin nombre',
        documentNumber: v.documentNumber || user?.cedula || '',
        documentType: v.documentType || '',
        faceMatchScore: v.faceMatchScore ?? 0,
        livenessScore: v.livenessScore ?? 0,
        documentValidityScore: v.documentValidityScore ?? 0,
        fraudScore: v.fraudScore ?? 0,
        userName: user?.name || 'Usuario',
        userEmail: user?.email || '',
        submittedAt: v.createdAt,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    });

    // Retornar respuesta con paginación (Requisito 22.5)
    const response: ApiResponse = {
      success: true,
      data: {
        verifications: mappedVerifications,
        total,
        page: pageNum,
        limit: limitNum
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get pending verifications error:', error);

    // Error genérico
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Ocurrió un error al obtener las verificaciones pendientes. Por favor, intenta nuevamente.'
      }
    };
    res.status(500).json(response);
  }
}

/**
 * Aprueba una verificación manualmente
 * 
 * @route POST /api/kyc/admin/approve/:verificationId
 * @access Operador (JWT + rol 'operator')
 * 
 * Requisitos: 14.1-14.10, 22.6
 */
export async function approveVerification(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Validar autenticación JWT (Requisito 22.6)
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      };
      res.status(401).json(response);
      return;
    }

    // Validar que usuario tenga rol 'operator' o 'admin' (Requisito 22.6)
    if (req.user.role !== 'operator' && req.user.role !== 'admin') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'No tienes permisos para aprobar verificaciones. Se requiere rol de operador o administrador.'
        }
      };
      res.status(403).json(response);
      return;
    }

    // Extraer operatorId del token (Requisito 22.6)
    const operatorId = req.user.userId;

    // Obtener verificationId del parámetro de ruta (Requisito 22.6)
    const verificationId = parseInt(req.params.verificationId, 10);

    if (isNaN(verificationId)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'ID de verificación inválido'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Extraer notes opcional del body (Requisito 22.6)
    const { notes } = req.body;

    // Llamar KYCService.approveVerification (Requisito 22.6)
    await kycService.approveVerification(verificationId, operatorId, notes);

    // Obtener verificación actualizada para retornar datos
    const verification = await kycService.getVerificationById(verificationId);

    if (!verification) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      };
      res.status(404).json(response);
      return;
    }

    // Retornar respuesta exitosa (Requisito 22.6)
    const response: ApiResponse = {
      success: true,
      data: {
        verificationId: verification.id,
        status: verification.status,
        verifiedAt: verification.verifiedAt
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Approve verification error:', error);

    // Manejar error de permisos insuficientes (Requisito 14.1)
    if (error.message && error.message.includes('Only operators can approve')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'Solo los operadores pueden aprobar verificaciones'
        }
      };
      res.status(403).json(response);
      return;
    }

    // Manejar error de verificación no encontrada
    if (error.message && error.message.includes('not found')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      };
      res.status(404).json(response);
      return;
    }

    // Error genérico
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Ocurrió un error al aprobar la verificación. Por favor, intenta nuevamente.'
      }
    };
    res.status(500).json(response);
  }
}

/**
 * Rechaza una verificación manualmente
 * 
 * @route POST /api/kyc/admin/reject/:verificationId
 * @access Operador (JWT + rol 'operator')
 * 
 * Requisitos: 15.1-15.10, 22.7
 */
export async function rejectVerification(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Validar autenticación JWT (Requisito 22.7)
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      };
      res.status(401).json(response);
      return;
    }

    // Validar que usuario tenga rol 'operator' o 'admin' (Requisito 22.7)
    if (req.user.role !== 'operator' && req.user.role !== 'admin') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'No tienes permisos para rechazar verificaciones. Se requiere rol de operador o administrador.'
        }
      };
      res.status(403).json(response);
      return;
    }

    // Extraer operatorId del token (Requisito 22.7)
    const operatorId = req.user.userId;

    // Obtener verificationId del parámetro de ruta (Requisito 22.7)
    const verificationId = parseInt(req.params.verificationId, 10);

    if (isNaN(verificationId)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'ID de verificación inválido'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Validar que reason sea obligatorio en body (Requisito 22.7)
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'El campo reason es obligatorio y debe contener la razón del rechazo'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Llamar KYCService.rejectVerification (Requisito 22.7)
    await kycService.rejectVerification(verificationId, operatorId, reason);

    // Obtener verificación actualizada para retornar datos
    const verification = await kycService.getVerificationById(verificationId);

    if (!verification) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      };
      res.status(404).json(response);
      return;
    }

    // Retornar respuesta exitosa (Requisito 22.7)
    const response: ApiResponse = {
      success: true,
      data: {
        verificationId: verification.id,
        status: verification.status,
        rejectionReason: verification.rejectionReason
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Reject verification error:', error);

    // Manejar error de permisos insuficientes (Requisito 15.1)
    if (error.message && error.message.includes('Only operators can reject')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'Solo los operadores pueden rechazar verificaciones'
        }
      };
      res.status(403).json(response);
      return;
    }

    // Manejar error de verificación no encontrada
    if (error.message && error.message.includes('not found')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      };
      res.status(404).json(response);
      return;
    }

    // Error genérico
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Ocurrió un error al rechazar la verificación. Por favor, intenta nuevamente.'
      }
    };
    res.status(500).json(response);
  }
}

/**
 * Obtiene detalles completos de una verificación para revisión
 * 
 * @route GET /api/kyc/admin/:verificationId
 * @access Operador (JWT + rol 'operator')
 * 
 * Requisitos: 13.1-13.16, 22.5
 */
export async function getVerificationDetails(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Validar autenticación JWT
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      };
      res.status(401).json(response);
      return;
    }

    // Validar que usuario tenga rol 'operator' o 'admin'
    if (req.user.role !== 'operator' && req.user.role !== 'admin') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'No tienes permisos para acceder a este recurso. Se requiere rol de operador o administrador.'
        }
      };
      res.status(403).json(response);
      return;
    }

    // Obtener verificationId del parámetro de ruta
    const verificationId = parseInt(req.params.verificationId, 10);

    if (isNaN(verificationId)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'ID de verificación inválido'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Obtener verificación con documentos, intentos y usuario asociado
    const verification = await KYCVerification.findByPk(verificationId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'phonePrefix', 'cedula', 'cedulaType']
        }
      ]
    });

    if (!verification) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      };
      res.status(404).json(response);
      return;
    }

    // Obtener documentos asociados
    const documents = await KYCDocument.findAll({
      where: { verificationId }
    });

    // Desencriptar documentos para visualización
    const encryptionService = new EncryptionService();
    const storageService = new StorageService();
    const kycService = new KYCService();
    
    const decryptedDocuments = await Promise.all(
      documents.map(async (doc) => {
        try {
          // Registrar acceso a documento encriptado en logs de auditoría (Requisito 32.7)
          await kycService.logDocumentAccess(req.user!.userId, verification.userId, doc.documentType);
          
          // Obtener archivo encriptado
          const encryptedBuffer = await storageService.get(doc.encryptedUrl);
          
          // Extraer IV y authTag de metadata
          const iv = Buffer.from(doc.metadata?.iv || '', 'hex');
          const authTag = Buffer.from(doc.metadata?.authTag || '', 'hex');

          // Desencriptar
          const decryptedBuffer = encryptionService.decrypt({
            encrypted: encryptedBuffer,
            iv,
            authTag
          });

          // Convertir a base64 para enviar al frontend
          const base64Data = decryptedBuffer.toString('base64');
          let mimeType = doc.metadata?.mimeType || '';
          if (!mimeType || mimeType === 'application/octet-stream') {
            if (doc.documentType === 'liveness_video') {
              mimeType = 'video/webm';
            } else {
              mimeType = 'image/jpeg';
            }
          }
          const dataUrl = `data:${mimeType};base64,${base64Data}`;

          return {
            id: doc.id,
            documentType: doc.documentType,
            url: dataUrl,
            fileHash: doc.fileHash,
            uploadedAt: doc.uploadedAt,
            metadata: {
              originalName: doc.metadata?.originalName,
              size: doc.metadata?.size,
              mimeType: doc.metadata?.mimeType
            }
          };
        } catch (error) {
          console.error(`Error decrypting document ${doc.id}:`, error);
          return {
            id: doc.id,
            documentType: doc.documentType,
            url: null,
            fileHash: doc.fileHash,
            uploadedAt: doc.uploadedAt,
            error: 'Error al desencriptar documento'
          };
        }
      })
    );

    // Obtener intentos asociados
    const attempts = await KYCAttempt.findAll({
      where: { verificationId },
      order: [['createdAt', 'DESC']]
    });

    // Retornar respuesta con todos los datos
    const response: ApiResponse = {
      success: true,
      data: {
        verification: {
          id: verification.id,
          userId: verification.userId,
          status: verification.status,
          verificationLevel: verification.verificationLevel,
          fullName: verification.fullName,
          documentNumber: verification.documentNumber,
          documentType: verification.documentType,
          dateOfBirth: verification.dateOfBirth,
          nationality: verification.nationality,
          address: verification.address,
          faceMatchScore: verification.faceMatchScore,
          livenessScore: verification.livenessScore,
          documentValidityScore: verification.documentValidityScore,
          fraudScore: verification.fraudScore,
          ocrData: verification.ocrData,
          reviewedBy: verification.reviewedBy,
          reviewedAt: verification.reviewedAt,
          reviewNotes: verification.reviewNotes,
          rejectionReason: verification.rejectionReason,
          attempts: verification.attempts,
          lastAttemptAt: verification.lastAttemptAt,
          verifiedAt: verification.verifiedAt,
          expiresAt: verification.expiresAt,
          createdAt: verification.createdAt,
          updatedAt: verification.updatedAt
        },
        documents: decryptedDocuments,
        attempts: attempts.map(attempt => ({
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          step: attempt.step,
          success: attempt.success,
          errorMessage: attempt.errorMessage,
          metadata: attempt.metadata,
          createdAt: attempt.createdAt
        })),
        user: (verification as any).user
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get verification details error:', error);

    // Error genérico
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Ocurrió un error al obtener los detalles de la verificación. Por favor, intenta nuevamente.'
      }
    };
    res.status(500).json(response);
  }
}

/**
 * Obtiene todos los datos KYC del usuario (derecho de acceso GDPR)
 * 
 * @route GET /api/kyc/gdpr/access
 * @access Autenticado (JWT)
 * 
 * Requisitos: 31.6
 */
export async function gdprAccessData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validar autenticación JWT
    if (!req.user) {
      throw new AuthenticationError();
    }

    const userId = req.user.userId;
    const ip = req.ip || req.socket.remoteAddress;

    // Registrar solicitud GDPR en logs de auditoría (Requisito 32.9)
    await auditLogger.logGDPRRequest(userId, 'access', ip);

    // Obtener verificación del usuario
    const verification = await KYCVerification.findOne({
      where: { userId }
    });

    // Obtener documentos asociados (sin contenido encriptado)
    let documents: any[] = [];
    if (verification) {
      const docs = await KYCDocument.findAll({
        where: { verificationId: verification.id }
      });

      documents = docs.map(doc => ({
        id: doc.id,
        documentType: doc.documentType,
        fileHash: doc.fileHash,
        uploadedAt: doc.uploadedAt,
        metadata: {
          originalName: doc.metadata?.originalName,
          size: doc.metadata?.size,
          mimeType: doc.metadata?.mimeType
        }
      }));
    }

    // Obtener intentos asociados
    let attempts: any[] = [];
    if (verification) {
      const kycAttempts = await KYCAttempt.findAll({
        where: { verificationId: verification.id },
        order: [['createdAt', 'DESC']]
      });

      attempts = kycAttempts.map(attempt => ({
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        step: attempt.step,
        success: attempt.success,
        errorMessage: attempt.errorMessage,
        createdAt: attempt.createdAt
      }));
    }

    // Retornar todos los datos del usuario
    const response: ApiResponse = {
      success: true,
      data: {
        verification: verification ? {
          id: verification.id,
          userId: verification.userId,
          status: verification.status,
          verificationLevel: verification.verificationLevel,
          fullName: verification.fullName,
          documentNumber: verification.documentNumber,
          documentType: verification.documentType,
          dateOfBirth: verification.dateOfBirth,
          nationality: verification.nationality,
          address: verification.address,
          faceMatchScore: verification.faceMatchScore,
          livenessScore: verification.livenessScore,
          documentValidityScore: verification.documentValidityScore,
          fraudScore: verification.fraudScore,
          ocrData: verification.ocrData,
          reviewedAt: verification.reviewedAt,
          reviewNotes: verification.reviewNotes,
          rejectionReason: verification.rejectionReason,
          attempts: verification.attempts,
          lastAttemptAt: verification.lastAttemptAt,
          verifiedAt: verification.verifiedAt,
          expiresAt: verification.expiresAt,
          consentedAt: verification.consentedAt,
          createdAt: verification.createdAt,
          updatedAt: verification.updatedAt
        } : null,
        documents,
        attempts
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
}

/**
 * Solicita rectificación de datos KYC (derecho de rectificación GDPR)
 * 
 * @route POST /api/kyc/gdpr/rectify
 * @access Autenticado (JWT)
 * 
 * Requisitos: 31.7
 */
export async function gdprRectifyData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validar autenticación JWT
    if (!req.user) {
      throw new AuthenticationError();
    }

    const userId = req.user.userId;
    const ip = req.ip || req.socket.remoteAddress;
    const { field, currentValue, requestedValue, reason } = req.body;

    // Validar campos requeridos
    if (!field || !requestedValue || !reason) {
      throw new ValidationError('Los campos field, requestedValue y reason son obligatorios');
    }

    // Registrar solicitud GDPR en logs de auditoría (Requisito 32.9)
    await auditLogger.logGDPRRequest(userId, 'rectification', ip);

    // Registrar solicitud de rectificación en logs de auditoría
    await auditLogger.logAuditEvent('gdpr_rectification_request', userId, {
      field,
      currentValue,
      requestedValue,
      reason
    }, ip);

    // Retornar confirmación (la rectificación requiere revisión manual)
    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Solicitud de rectificación recibida. Será revisada por nuestro equipo en un plazo de 30 días.',
        requestDetails: {
          field,
          currentValue,
          requestedValue,
          reason,
          submittedAt: new Date()
        }
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
}

/**
 * Solicita eliminación de datos KYC (derecho al olvido GDPR)
 * 
 * @route POST /api/kyc/gdpr/delete
 * @access Autenticado (JWT)
 * 
 * Requisitos: 31.8, 31.10
 */
export async function gdprDeleteData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validar autenticación JWT
    if (!req.user) {
      throw new AuthenticationError();
    }

    const userId = req.user.userId;
    const ip = req.ip || req.socket.remoteAddress;
    const { reason } = req.body;

    // Validar campo requerido
    if (!reason) {
      throw new ValidationError('El campo reason es obligatorio');
    }

    // Registrar solicitud GDPR en logs de auditoría (Requisito 32.9)
    await auditLogger.logGDPRRequest(userId, 'erasure', ip);

    // Calcular fecha de eliminación (30 días desde ahora) (Requisito 31.10)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    // Registrar solicitud de eliminación en logs de auditoría
    await auditLogger.logAuditEvent('gdpr_deletion_request', userId, {
      reason,
      scheduledDeletionDate: deletionDate
    }, ip);

    // Ejecutar eliminación inmediata de documentos físicos y anonimización (Requisito 31.10)
    // La eliminación se completa en 30 días, pero los documentos físicos se eliminan inmediatamente
    await kycService.deleteUserDataByRequest(userId, reason);

    // Retornar confirmación
    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Solicitud de eliminación recibida. Tus datos serán eliminados en 30 días.',
        scheduledDeletionDate: deletionDate,
        reason
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
}

/**
 * Exporta datos KYC en formato JSON (derecho de portabilidad GDPR)
 * 
 * @route GET /api/kyc/gdpr/export
 * @access Autenticado (JWT)
 * 
 * Requisitos: 31.9
 */
export async function gdprExportData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validar autenticación JWT
    if (!req.user) {
      throw new AuthenticationError();
    }

    const userId = req.user.userId;
    const ip = req.ip || req.socket.remoteAddress;

    // Registrar solicitud GDPR en logs de auditoría (Requisito 32.9)
    await auditLogger.logGDPRRequest(userId, 'portability', ip);

    // Obtener verificación del usuario
    const verification = await KYCVerification.findOne({
      where: { userId }
    });

    // Obtener documentos asociados (sin contenido encriptado)
    let documents: any[] = [];
    if (verification) {
      const docs = await KYCDocument.findAll({
        where: { verificationId: verification.id }
      });

      documents = docs.map(doc => ({
        id: doc.id,
        documentType: doc.documentType,
        fileHash: doc.fileHash,
        uploadedAt: doc.uploadedAt,
        metadata: {
          originalName: doc.metadata?.originalName,
          size: doc.metadata?.size,
          mimeType: doc.metadata?.mimeType
        }
      }));
    }

    // Obtener intentos asociados
    let attempts: any[] = [];
    if (verification) {
      const kycAttempts = await KYCAttempt.findAll({
        where: { verificationId: verification.id },
        order: [['createdAt', 'DESC']]
      });

      attempts = kycAttempts.map(attempt => ({
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        step: attempt.step,
        success: attempt.success,
        errorMessage: attempt.errorMessage,
        createdAt: attempt.createdAt
      }));
    }

    // Construir objeto de exportación en formato JSON estructurado
    const exportData = {
      exportDate: new Date(),
      userId,
      verification: verification ? {
        id: verification.id,
        status: verification.status,
        verificationLevel: verification.verificationLevel,
        fullName: verification.fullName,
        documentNumber: verification.documentNumber,
        documentType: verification.documentType,
        dateOfBirth: verification.dateOfBirth,
        nationality: verification.nationality,
        address: verification.address,
        faceMatchScore: verification.faceMatchScore,
        livenessScore: verification.livenessScore,
        documentValidityScore: verification.documentValidityScore,
        fraudScore: verification.fraudScore,
        ocrData: verification.ocrData,
        reviewedAt: verification.reviewedAt,
        reviewNotes: verification.reviewNotes,
        rejectionReason: verification.rejectionReason,
        attempts: verification.attempts,
        lastAttemptAt: verification.lastAttemptAt,
        verifiedAt: verification.verifiedAt,
        expiresAt: verification.expiresAt,
        consentedAt: verification.consentedAt,
        createdAt: verification.createdAt,
        updatedAt: verification.updatedAt
      } : null,
      documents,
      attempts
    };

    // Retornar datos en formato JSON
    const response: ApiResponse = {
      success: true,
      data: exportData
    };
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
}

/**
 * Obtiene métricas agregadas del sistema KYC
 * 
 * @route GET /api/kyc/admin/metrics
 * @access Autenticado (JWT) + Rol operator
 * 
 * Requisito: 33.11
 */
export async function getMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validar autenticación JWT
    if (!req.user) {
      throw new AuthenticationError();
    }

    // Validar rol operator o admin (ya validado por middleware requireRole, pero verificamos por seguridad)
    if (req.user.role !== 'operator' && req.user.role !== 'admin') {
      throw new AuthorizationError('Solo operadores o administradores pueden acceder a las métricas');
    }

    // Extraer filtros opcionales de query params
    const { dateFrom, dateTo } = req.query;

    // TODO: Implementar filtrado por rango de fechas en MetricsService
    // Por ahora, retornamos todas las métricas sin filtrar
    // En una implementación futura, se pasarían dateFrom y dateTo al servicio

    // Obtener todas las métricas agregadas
    const metrics = await metricsService.getAllMetrics();

    // Retornar métricas
    const response: ApiResponse = {
      success: true,
      data: metrics
    };
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
}

/**
 * Guarda el progreso del nivel actual del KYC
 * 
 * @route POST /api/kyc/level/save
 * @access Autenticado (JWT)
 */
export async function saveLevelProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const userId = req.user.userId;
    const { level, data } = req.body;

    // Validar campos requeridos
    if (!level || !data) {
      throw new ValidationError('Los campos level y data son obligatorios');
    }

    // Validar que level sea 1, 2 o 3
    if (![1, 2, 3].includes(level)) {
      throw new ValidationError('El nivel debe ser 1, 2 o 3');
    }

    // Obtener verificación del usuario
    const verification = await kycService.getVerificationByUserId(userId);

    if (!verification) {
      throw new NotFoundError('No se encontró una verificación activa. Por favor, inicia el proceso KYC primero.');
    }

    // Guardar progreso del nivel
    await kycService.saveLevelProgress(verification.id, level, data);

    const response: ApiResponse = {
      success: true,
      data: {
        message: `Progreso del nivel ${level} guardado exitosamente`,
        level,
        savedAt: new Date()
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
}

/**
 * Completa un nivel del KYC y lo envía a revisión si es necesario
 * 
 * @route POST /api/kyc/level/complete
 * @access Autenticado (JWT)
 */
export async function completeLevel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const userId = req.user.userId;
    const { level, data } = req.body;

    // Validar campos requeridos
    if (!level || !data) {
      throw new ValidationError('Los campos level y data son obligatorios');
    }

    // Validar que level sea 1, 2 o 3
    if (![1, 2, 3].includes(level)) {
      throw new ValidationError('El nivel debe ser 1, 2 o 3');
    }

    // Obtener verificación del usuario
    const verification = await kycService.getVerificationByUserId(userId);

    if (!verification) {
      throw new NotFoundError('No se encontró una verificación activa. Por favor, inicia el proceso KYC primero.');
    }

    // Completar nivel
    const result = await kycService.completeLevel(verification.id, level, data);

    const response: ApiResponse = {
      success: true,
      data: {
        message: result.message,
        level,
        status: result.status,
        currentLevel: result.currentLevel,
        completedAt: result.completedAt,
        requiresReview: result.requiresReview
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
}

/**
 * Obtiene el progreso actual del KYC por niveles
 * 
 * @route GET /api/kyc/level/progress
 * @access Autenticado (JWT)
 */
export async function getLevelProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const userId = req.user.userId;

    // Obtener verificación del usuario
    const verification = await kycService.getVerificationByUserId(userId);

    if (!verification) {
      const response: ApiResponse = {
        success: true,
        data: {
          hasVerification: false,
          currentLevel: 0,
          status: 'not_started'
        }
      };
      res.status(200).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        hasVerification: true,
        verificationId: verification.id,
        currentLevel: verification.currentLevel,
        status: verification.status,
        verificationLevel: verification.verificationLevel,
        levels: {
          level1: {
            completed: !!verification.level1CompletedAt,
            completedAt: verification.level1CompletedAt,
            data: verification.level1Data
          },
          level2: {
            completed: !!verification.level2CompletedAt,
            completedAt: verification.level2CompletedAt,
            data: verification.level2Data
          },
          level3: {
            completed: !!verification.level3CompletedAt,
            completedAt: verification.level3CompletedAt,
            data: verification.level3Data
          }
        },
        createdAt: verification.createdAt,
        updatedAt: verification.updatedAt
      }
    };
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
}
