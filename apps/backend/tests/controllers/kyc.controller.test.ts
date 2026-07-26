// Mock KYCService before importing controller
const mockCreateVerification = jest.fn();
const mockUploadDocument = jest.fn();
const mockProcessVerification = jest.fn();
const mockGetVerificationById = jest.fn();
const mockGetVerificationByUserId = jest.fn();
const mockGetPendingVerifications = jest.fn();
const mockApproveVerification = jest.fn();

jest.mock('../../src/services/kyc.service', () => ({
  KYCService: jest.fn().mockImplementation(() => ({
    createVerification: mockCreateVerification,
    uploadDocument: mockUploadDocument,
    processVerification: mockProcessVerification,
    getVerificationById: mockGetVerificationById,
    getVerificationByUserId: mockGetVerificationByUserId,
    getPendingVerifications: mockGetPendingVerifications,
    approveVerification: mockApproveVerification
  }))
}));

// Mock MetricsService
const mockGetAllMetrics = jest.fn();

jest.mock('../../src/services/metrics.service', () => ({
  MetricsService: jest.fn().mockImplementation(() => ({
    getAllMetrics: mockGetAllMetrics
  }))
}));

// Mock models
const mockKYCVerificationFindByPk = jest.fn();
const mockKYCDocumentFindAll = jest.fn();
const mockKYCAttemptFindAll = jest.fn();

jest.mock('../../src/models/KYCVerification', () => ({
  __esModule: true,
  default: {
    findByPk: mockKYCVerificationFindByPk
  }
}));

jest.mock('../../src/models/KYCDocument', () => ({
  __esModule: true,
  default: {
    findAll: mockKYCDocumentFindAll
  }
}));

jest.mock('../../src/models/KYCAttempt', () => ({
  __esModule: true,
  default: {
    findAll: mockKYCAttemptFindAll
  }
}));

// Mock EncryptionService
const mockDecrypt = jest.fn();
const mockCalculateHash = jest.fn();

jest.mock('../../src/services/encryption.service', () => ({
  EncryptionService: jest.fn().mockImplementation(() => ({
    decrypt: mockDecrypt,
    calculateHash: mockCalculateHash
  }))
}));

// Mock StorageService
const mockStorageGet = jest.fn();

jest.mock('../../src/services/storage.service', () => ({
  StorageService: jest.fn().mockImplementation(() => ({
    get: mockStorageGet
  }))
}));

import { Response } from 'express';
import { startVerification, uploadDocument, processVerification, getVerificationStatus, getVerificationDetails, approveVerification, gdprAccessData, gdprRectifyData, gdprDeleteData, gdprExportData, getMetrics } from '../../src/controllers/kyc.controller';
import { AuthRequest, ErrorCodes } from '../../src/types';

/**
 * Unit tests for KYC Controller
 * 
 * Tests the startVerification endpoint functionality including:
 * - Successful verification creation
 * - Authentication validation
 * - Error handling for limit exceeded
 * - Error handling for active verification
 */

describe('KYC Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      user: {
        userId: 1,
        email: 'test@example.com',
        role: 'cliente'
      }
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('startVerification', () => {
    it('should create verification successfully and return 201', async () => {
      // Arrange
      const mockVerification = {
        id: 1,
        userId: 1,
        status: 'not_started',
        verificationLevel: 0,
        attempts: 0
      };

      mockCreateVerification.mockResolvedValue(mockVerification as any);

      // Act
      await startVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockCreateVerification).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          verificationId: 1,
          status: 'not_started',
          currentStep: 'document_capture'
        }
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await startVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockCreateVerification).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      });
    });

    it('should return 403 when user exceeds 3 attempts limit', async () => {
      // Arrange
      mockCreateVerification.mockRejectedValue(
        new Error('Maximum of 3 verification attempts per 30 days exceeded')
      );

      // Act
      await startVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'Has excedido el límite de 3 intentos de verificación en 30 días. Por favor, contacta al soporte.'
        }
      });
    });

    it('should return 409 when user has active verification', async () => {
      // Arrange
      mockCreateVerification.mockRejectedValue(
        new Error('User already has an active verification in progress')
      );

      // Act
      await startVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.DUPLICATE_ENTRY,
          message: 'Ya tienes una verificación en progreso. Por favor, completa la verificación actual antes de iniciar una nueva.'
        }
      });
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      mockCreateVerification.mockRejectedValue(
        new Error('Unexpected database error')
      );

      // Act
      await startVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Ocurrió un error al iniciar la verificación. Por favor, intenta nuevamente en unos momentos.'
        }
      });
    });
  });

  describe('uploadDocument', () => {
    it('should upload document successfully and return 201', async () => {
      // Arrange
      const mockDocument = {
        id: 1,
        verificationId: 1,
        documentType: 'id_front',
        url: '1-id_front-123456789',
        encryptedUrl: '1-id_front-123456789.enc',
        fileHash: 'abc123def456',
        metadata: {},
        uploadedAt: new Date()
      };

      mockUploadDocument.mockResolvedValue(mockDocument as any);

      mockRequest.body = {
        verificationId: '1',
        documentType: 'id_front'
      };
      mockRequest.file = {
        buffer: Buffer.from('fake image data'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        size: 1024
      } as any;

      // Act
      await uploadDocument(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockUploadDocument).toHaveBeenCalledWith(
        1,
        'id_front',
        expect.any(Buffer)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          documentId: 1,
          url: '1-id_front-123456789',
          fileHash: 'abc123def456'
        }
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = {
        verificationId: '1',
        documentType: 'id_front'
      };
      mockRequest.file = {
        buffer: Buffer.from('fake image data')
      } as any;

      // Act
      await uploadDocument(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockUploadDocument).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      });
    });

    it('should return 400 if verificationId is missing', async () => {
      // Arrange
      mockRequest.body = {
        documentType: 'id_front'
      };
      mockRequest.file = {
        buffer: Buffer.from('fake image data')
      } as any;

      // Act
      await uploadDocument(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockUploadDocument).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'El campo verificationId es obligatorio'
        }
      });
    });

    it('should return 400 if documentType is missing', async () => {
      // Arrange
      mockRequest.body = {
        verificationId: '1'
      };
      mockRequest.file = {
        buffer: Buffer.from('fake image data')
      } as any;

      // Act
      await uploadDocument(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockUploadDocument).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'El campo documentType es obligatorio'
        }
      });
    });

    it('should return 400 if file is missing', async () => {
      // Arrange
      mockRequest.body = {
        verificationId: '1',
        documentType: 'id_front'
      };
      mockRequest.file = undefined;

      // Act
      await uploadDocument(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockUploadDocument).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'El archivo es obligatorio'
        }
      });
    });

    it('should return 400 if documentType is invalid', async () => {
      // Arrange
      mockRequest.body = {
        verificationId: '1',
        documentType: 'invalid_type'
      };
      mockRequest.file = {
        buffer: Buffer.from('fake image data')
      } as any;

      // Act
      await uploadDocument(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockUploadDocument).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'documentType debe ser uno de: id_front, id_back, selfie, selfie_with_doc, liveness_video, proof_of_address'
        }
      });
    });

    it('should return 404 if verification not found', async () => {
      // Arrange
      mockUploadDocument.mockRejectedValue(
        new Error('Verification with id 999 not found')
      );

      mockRequest.body = {
        verificationId: '999',
        documentType: 'id_front'
      };
      mockRequest.file = {
        buffer: Buffer.from('fake image data')
      } as any;

      // Act
      await uploadDocument(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      });
    });

    it('should return 400 if file is too large', async () => {
      // Arrange
      mockUploadDocument.mockRejectedValue(
        new Error('File too large')
      );

      mockRequest.body = {
        verificationId: '1',
        documentType: 'id_front'
      };
      mockRequest.file = {
        buffer: Buffer.from('fake image data')
      } as any;

      // Act
      await uploadDocument(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'El archivo es muy grande. Tamaño máximo: 10MB'
        }
      });
    });

    it('should return 400 if file type is invalid', async () => {
      // Arrange
      mockUploadDocument.mockRejectedValue(
        new Error('Tipo de archivo no válido. Solo se permiten imágenes JPEG/PNG y videos WebM/MP4.')
      );

      mockRequest.body = {
        verificationId: '1',
        documentType: 'id_front'
      };
      mockRequest.file = {
        buffer: Buffer.from('fake image data')
      } as any;

      // Act
      await uploadDocument(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Tipo de archivo no válido. Solo se permiten imágenes JPEG/PNG y videos WebM/MP4.'
        }
      });
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      mockUploadDocument.mockRejectedValue(
        new Error('Unexpected storage error')
      );

      mockRequest.body = {
        verificationId: '1',
        documentType: 'id_front'
      };
      mockRequest.file = {
        buffer: Buffer.from('fake image data')
      } as any;

      // Act
      await uploadDocument(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Ocurrió un error al subir el documento. Por favor, intenta nuevamente.'
        }
      });
    });
  });

  describe('processVerification', () => {
    it('should process verification successfully and return 200', async () => {
      // Arrange
      const mockVerification = {
        id: 1,
        userId: 1,
        status: 'documents_uploaded'
      };

      const mockProcessingResult = {
        success: true,
        status: 'pending_review',
        ocrData: {
          documentNumber: 'V-12345678',
          fullName: 'Juan Pérez',
          dateOfBirth: new Date('1990-01-01')
        },
        faceMatchScore: 87.5,
        livenessScore: 92.0,
        documentValidityScore: 95.0,
        fraudScore: 15.0
      };

      mockGetVerificationById.mockResolvedValue(mockVerification);
      mockProcessVerification.mockResolvedValue(mockProcessingResult);

      mockRequest.params = { verificationId: '1' };

      // Act
      await processVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockGetVerificationById).toHaveBeenCalledWith(1);
      expect(mockProcessVerification).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'pending_review',
          ocrData: mockProcessingResult.ocrData,
          scores: {
            faceMatch: 87.5,
            liveness: 92.0,
            documentValidity: 95.0,
            fraud: 15.0
          }
        }
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { verificationId: '1' };

      // Act
      await processVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      });
    });

    it('should return 400 if verificationId is invalid', async () => {
      // Arrange
      mockRequest.params = { verificationId: 'invalid' };

      // Act
      await processVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'ID de verificación inválido'
        }
      });
    });

    it('should return 404 if verification not found', async () => {
      // Arrange
      mockGetVerificationById.mockResolvedValue(null);
      mockRequest.params = { verificationId: '999' };

      // Act
      await processVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      });
    });

    it('should return 403 if verification does not belong to user', async () => {
      // Arrange
      const mockVerification = {
        id: 1,
        userId: 999, // Different user
        status: 'documents_uploaded'
      };

      mockGetVerificationById.mockResolvedValue(mockVerification);
      mockRequest.params = { verificationId: '1' };

      // Act
      await processVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'No tienes permiso para procesar esta verificación'
        }
      });
    });

    it('should return 400 if documents are incomplete', async () => {
      // Arrange
      const mockVerification = {
        id: 1,
        userId: 1,
        status: 'in_progress'
      };

      mockGetVerificationById.mockResolvedValue(mockVerification);
      mockProcessVerification.mockRejectedValue(
        new Error('Missing required document: selfie')
      );

      mockRequest.params = { verificationId: '1' };

      // Act
      await processVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Documentos incompletos. Por favor, sube todos los documentos requeridos antes de procesar.'
        }
      });
    });

    it('should return 422 if processing fails', async () => {
      // Arrange
      const mockVerification = {
        id: 1,
        userId: 1,
        status: 'documents_uploaded'
      };

      mockGetVerificationById.mockResolvedValue(mockVerification);
      mockProcessVerification.mockRejectedValue(
        new Error('Processing failed: OCR extraction error')
      );

      mockRequest.params = { verificationId: '1' };

      // Act
      await processVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'El procesamiento de la verificación falló. Por favor, intenta nuevamente.'
        }
      });
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      const mockVerification = {
        id: 1,
        userId: 1,
        status: 'documents_uploaded'
      };

      mockGetVerificationById.mockResolvedValue(mockVerification);
      mockProcessVerification.mockRejectedValue(
        new Error('Unexpected database error')
      );

      mockRequest.params = { verificationId: '1' };

      // Act
      await processVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Ocurrió un error al procesar la verificación. Por favor, intenta nuevamente en unos momentos.'
        }
      });
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status successfully and return 200', async () => {
      // Arrange
      const mockVerification = {
        id: 1,
        userId: 1,
        status: 'approved',
        verificationLevel: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        expiresAt: new Date('2025-01-15')
      };

      mockGetVerificationByUserId.mockResolvedValue(mockVerification as any);

      // Act
      await getVerificationStatus(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockGetVerificationByUserId).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          verificationId: 1,
          status: 'approved',
          verificationLevel: 5,
          createdAt: mockVerification.createdAt,
          updatedAt: mockVerification.updatedAt,
          expiresAt: mockVerification.expiresAt
        }
      });
    });

    it('should return null if no verification exists', async () => {
      // Arrange
      mockGetVerificationByUserId.mockResolvedValue(null);

      // Act
      await getVerificationStatus(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockGetVerificationByUserId).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: null
      });
    });

    it('should return null for expiresAt if not set', async () => {
      // Arrange
      const mockVerification = {
        id: 1,
        userId: 1,
        status: 'in_progress',
        verificationLevel: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        expiresAt: undefined
      };

      mockGetVerificationByUserId.mockResolvedValue(mockVerification as any);

      // Act
      await getVerificationStatus(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          verificationId: 1,
          status: 'in_progress',
          verificationLevel: 0,
          createdAt: mockVerification.createdAt,
          updatedAt: mockVerification.updatedAt,
          expiresAt: null
        }
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await getVerificationStatus(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockGetVerificationByUserId).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      });
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      mockGetVerificationByUserId.mockRejectedValue(
        new Error('Unexpected database error')
      );

      // Act
      await getVerificationStatus(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Ocurrió un error al obtener el estado de verificación. Por favor, intenta nuevamente.'
        }
      });
    });
  });

  describe('getVerificationDetails', () => {
    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();
    });

    it('should return verification details successfully for operator', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: '1' }
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      const mockVerification = {
        id: 1,
        userId: 5,
        status: 'pending_review',
        verificationLevel: 2,
        fullName: 'Juan Pérez',
        documentNumber: 'V-12345678',
        faceMatchScore: 87.5,
        livenessScore: 92.0,
        documentValidityScore: 95.0,
        fraudScore: 15.0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        user: {
          id: 5,
          name: 'Juan Pérez',
          email: 'juan@example.com',
          phone: '1234567890',
          phonePrefix: '+58',
          cedula: '12345678',
          cedulaType: 'V'
        }
      };

      const mockDocuments = [
        {
          id: 1,
          verificationId: 1,
          documentType: 'id_front',
          encryptedUrl: 'path/to/encrypted/file.enc',
          fileHash: 'abc123',
          uploadedAt: new Date('2024-01-01'),
          metadata: {
            iv: '1234567890abcdef1234567890abcdef',
            authTag: 'REDACTED',
            mimeType: 'image/jpeg',
            originalName: 'id_front.jpg',
            size: 1024
          }
        }
      ];

      const mockAttempts = [
        {
          id: 1,
          verificationId: 1,
          attemptNumber: 1,
          step: 'document_capture',
          success: true,
          errorMessage: null,
          metadata: {},
          createdAt: new Date('2024-01-01')
        }
      ];

      mockKYCVerificationFindByPk.mockResolvedValue(mockVerification);
      mockKYCDocumentFindAll.mockResolvedValue(mockDocuments);
      mockKYCAttemptFindAll.mockResolvedValue(mockAttempts);
      mockStorageGet.mockResolvedValue(Buffer.from('encrypted data'));
      mockDecrypt.mockReturnValue(Buffer.from('decrypted image data'));

      // Act
      await getVerificationDetails(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockKYCVerificationFindByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(mockKYCDocumentFindAll).toHaveBeenCalledWith({ where: { verificationId: 1 } });
      expect(mockKYCAttemptFindAll).toHaveBeenCalledWith({
        where: { verificationId: 1 },
        order: [['createdAt', 'DESC']]
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          verification: expect.objectContaining({
            id: 1,
            userId: 5,
            status: 'pending_review'
          }),
          documents: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              documentType: 'id_front',
              url: expect.stringContaining('data:image/jpeg;base64,')
            })
          ]),
          attempts: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              step: 'document_capture',
              success: true
            })
          ]),
          user: mockVerification.user
        })
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: undefined,
        params: { verificationId: '1' }
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      // Act
      await getVerificationDetails(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      });
    });

    it('should return 403 if user is not an operator', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 5,
          email: 'user@example.com',
          role: 'cliente'
        },
        params: { verificationId: '1' }
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      // Act
      await getVerificationDetails(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'No tienes permisos para acceder a este recurso. Se requiere rol de operador.'
        }
      });
    });

    it('should return 400 if verificationId is invalid', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: 'invalid' }
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      // Act
      await getVerificationDetails(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'ID de verificación inválido'
        }
      });
    });

    it('should return 404 if verification not found', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: '999' }
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      mockKYCVerificationFindByPk.mockResolvedValue(null);

      // Act
      await getVerificationDetails(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      });
    });

    it('should handle document decryption errors gracefully', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: '1' }
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      const mockVerification = {
        id: 1,
        userId: 5,
        status: 'pending_review',
        user: {
          id: 5,
          name: 'Juan Pérez',
          email: 'juan@example.com'
        }
      };

      const mockDocuments = [
        {
          id: 1,
          verificationId: 1,
          documentType: 'id_front',
          encryptedUrl: 'path/to/encrypted/file.enc',
          fileHash: 'abc123',
          uploadedAt: new Date('2024-01-01'),
          metadata: {
            iv: '1234567890abcdef1234567890abcdef',
            authTag: 'REDACTED'
          }
        }
      ];

      mockKYCVerificationFindByPk.mockResolvedValue(mockVerification);
      mockKYCDocumentFindAll.mockResolvedValue(mockDocuments);
      mockKYCAttemptFindAll.mockResolvedValue([]);
      mockStorageGet.mockRejectedValue(new Error('Storage error'));

      // Act
      await getVerificationDetails(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          documents: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              documentType: 'id_front',
              url: null,
              error: 'Error al desencriptar documento'
            })
          ])
        })
      });
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: '1' }
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      mockKYCVerificationFindByPk.mockRejectedValue(new Error('Database error'));

      // Act
      await getVerificationDetails(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Ocurrió un error al obtener los detalles de la verificación. Por favor, intenta nuevamente.'
        }
      });
    });
  });

  describe('approveVerification', () => {
    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();
    });

    it('should approve verification successfully and return 200', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: '1' },
        body: { notes: 'Documentos verificados correctamente' }
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      const mockVerification = {
        id: 1,
        userId: 5,
        status: 'approved',
        verifiedAt: new Date('2024-01-15T10:00:00Z')
      };

      mockApproveVerification.mockResolvedValue(undefined);
      mockGetVerificationById.mockResolvedValue(mockVerification);

      // Act
      await approveVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockApproveVerification).toHaveBeenCalledWith(1, 10, 'Documentos verificados correctamente');
      expect(mockGetVerificationById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          verificationId: 1,
          status: 'approved',
          verifiedAt: mockVerification.verifiedAt
        }
      });
    });

    it('should approve verification without notes successfully', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: '1' },
        body: {}
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      const mockVerification = {
        id: 1,
        userId: 5,
        status: 'approved',
        verifiedAt: new Date('2024-01-15T10:00:00Z')
      };

      mockApproveVerification.mockResolvedValue(undefined);
      mockGetVerificationById.mockResolvedValue(mockVerification);

      // Act
      await approveVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockApproveVerification).toHaveBeenCalledWith(1, 10, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: undefined,
        params: { verificationId: '1' },
        body: {}
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      // Act
      await approveVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockApproveVerification).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No autenticado'
        }
      });
    });

    it('should return 403 if user is not an operator', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 5,
          email: 'user@example.com',
          role: 'cliente'
        },
        params: { verificationId: '1' },
        body: {}
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      // Act
      await approveVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockApproveVerification).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'No tienes permisos para aprobar verificaciones. Se requiere rol de operador.'
        }
      });
    });

    it('should return 400 if verificationId is invalid', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: 'invalid' },
        body: {}
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      // Act
      await approveVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockApproveVerification).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'ID de verificación inválido'
        }
      });
    });

    it('should return 404 if verification not found', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: '999' },
        body: {}
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      mockApproveVerification.mockRejectedValue(
        new Error('Verification with id 999 not found')
      );

      // Act
      await approveVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Verificación no encontrada'
        }
      });
    });

    it('should return 403 if service rejects non-operator', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: '1' },
        body: {}
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      mockApproveVerification.mockRejectedValue(
        new Error('Only operators can approve verifications')
      );

      // Act
      await approveVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'Solo los operadores pueden aprobar verificaciones'
        }
      });
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      const mockRequest: Partial<AuthRequest> = {
        user: {
          userId: 10,
          email: 'operator@example.com',
          role: 'operator'
        },
        params: { verificationId: '1' },
        body: {}
      };

      const mockResponse: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      mockApproveVerification.mockRejectedValue(
        new Error('Unexpected database error')
      );

      // Act
      await approveVerification(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Ocurrió un error al aprobar la verificación. Por favor, intenta nuevamente.'
        }
      });
    });
  });

  describe('GDPR Endpoints', () => {
    // Mock audit logger
    const mockLogGDPRRequest = jest.fn();
    const mockLogAuditEvent = jest.fn();

    beforeAll(() => {
      jest.mock('../../src/services/audit-logger.service', () => ({
        auditLogger: {
          logGDPRRequest: mockLogGDPRRequest,
          logAuditEvent: mockLogAuditEvent
        }
      }));
    });

    beforeEach(() => {
      jest.clearAllMocks();
      mockRequest = {
        user: {
          userId: 1,
          email: 'test@example.com',
          role: 'cliente'
        },
        ip: '127.0.0.1'
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
    });

    describe('gdprAccessData', () => {
      it('should return all user KYC data successfully', async () => {
        // Arrange
        const mockVerification = {
          id: 1,
          userId: 1,
          status: 'approved',
          verificationLevel: 5,
          fullName: 'Juan Pérez',
          documentNumber: 'V-12345678',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15')
        };

        const mockDocuments = [
          {
            id: 1,
            documentType: 'id_front',
            fileHash: 'abc123',
            uploadedAt: new Date('2024-01-01'),
            metadata: {
              originalName: 'id_front.jpg',
              size: 1024,
              mimeType: 'image/jpeg'
            }
          }
        ];

        const mockAttempts = [
          {
            id: 1,
            attemptNumber: 1,
            step: 'document_capture',
            success: true,
            errorMessage: null,
            createdAt: new Date('2024-01-01')
          }
        ];

        const mockKYCVerificationFindOne = jest.fn().mockResolvedValue(mockVerification);
        const mockKYCDocumentFindAll = jest.fn().mockResolvedValue(mockDocuments);
        const mockKYCAttemptFindAll = jest.fn().mockResolvedValue(mockAttempts);

        // Mock the models
        jest.mock('../../src/models/KYCVerification', () => ({
          __esModule: true,
          default: {
            findOne: mockKYCVerificationFindOne
          }
        }));

        jest.mock('../../src/models/KYCDocument', () => ({
          __esModule: true,
          default: {
            findAll: mockKYCDocumentFindAll
          }
        }));

        jest.mock('../../src/models/KYCAttempt', () => ({
          __esModule: true,
          default: {
            findAll: mockKYCAttemptFindAll
          }
        }));

        const { gdprAccessData } = require('../../src/controllers/kyc.controller');

        // Act
        await gdprAccessData(mockRequest as AuthRequest, mockResponse as Response, jest.fn());

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            verification: expect.objectContaining({
              id: 1,
              userId: 1,
              status: 'approved'
            }),
            documents: expect.any(Array),
            attempts: expect.any(Array)
          })
        });
      });

      it('should return 401 if user is not authenticated', async () => {
        // Arrange
        mockRequest.user = undefined;
        const { gdprAccessData } = require('../../src/controllers/kyc.controller');
        const mockNext = jest.fn();

        // Act
        await gdprAccessData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('gdprRectifyData', () => {
      it('should accept rectification request successfully', async () => {
        // Arrange
        mockRequest.body = {
          field: 'fullName',
          currentValue: 'Juan Perez',
          requestedValue: 'Juan Pérez',
          reason: 'Corrección de acento en apellido'
        };

        const { gdprRectifyData } = require('../../src/controllers/kyc.controller');

        // Act
        await gdprRectifyData(mockRequest as AuthRequest, mockResponse as Response, jest.fn());

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            message: expect.stringContaining('Solicitud de rectificación recibida'),
            requestDetails: expect.objectContaining({
              field: 'fullName',
              requestedValue: 'Juan Pérez',
              reason: 'Corrección de acento en apellido'
            })
          })
        });
      });

      it('should return 400 if required fields are missing', async () => {
        // Arrange
        mockRequest.body = {
          field: 'fullName'
          // Missing requestedValue and reason
        };

        const { gdprRectifyData } = require('../../src/controllers/kyc.controller');
        const mockNext = jest.fn();

        // Act
        await gdprRectifyData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('gdprDeleteData', () => {
      it('should schedule data deletion successfully', async () => {
        // Arrange
        mockRequest.body = {
          reason: 'Ya no deseo usar el servicio'
        };

        const { gdprDeleteData } = require('../../src/controllers/kyc.controller');

        // Act
        await gdprDeleteData(mockRequest as AuthRequest, mockResponse as Response, jest.fn());

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            message: expect.stringContaining('Solicitud de eliminación recibida'),
            scheduledDeletionDate: expect.any(Date),
            reason: 'Ya no deseo usar el servicio'
          })
        });
      });

      it('should return 400 if reason is missing', async () => {
        // Arrange
        mockRequest.body = {};

        const { gdprDeleteData } = require('../../src/controllers/kyc.controller');
        const mockNext = jest.fn();

        // Act
        await gdprDeleteData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('gdprExportData', () => {
      it('should export user data in JSON format successfully', async () => {
        // Arrange
        const mockVerification = {
          id: 1,
          userId: 1,
          status: 'approved',
          verificationLevel: 5,
          fullName: 'Juan Pérez',
          documentNumber: 'V-12345678',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15')
        };

        const mockDocuments = [
          {
            id: 1,
            documentType: 'id_front',
            fileHash: 'abc123',
            uploadedAt: new Date('2024-01-01'),
            metadata: {
              originalName: 'id_front.jpg',
              size: 1024,
              mimeType: 'image/jpeg'
            }
          }
        ];

        const mockAttempts = [
          {
            id: 1,
            attemptNumber: 1,
            step: 'document_capture',
            success: true,
            errorMessage: null,
            createdAt: new Date('2024-01-01')
          }
        ];

        const mockKYCVerificationFindOne = jest.fn().mockResolvedValue(mockVerification);
        const mockKYCDocumentFindAll = jest.fn().mockResolvedValue(mockDocuments);
        const mockKYCAttemptFindAll = jest.fn().mockResolvedValue(mockAttempts);

        // Mock the models
        jest.mock('../../src/models/KYCVerification', () => ({
          __esModule: true,
          default: {
            findOne: mockKYCVerificationFindOne
          }
        }));

        jest.mock('../../src/models/KYCDocument', () => ({
          __esModule: true,
          default: {
            findAll: mockKYCDocumentFindAll
          }
        }));

        jest.mock('../../src/models/KYCAttempt', () => ({
          __esModule: true,
          default: {
            findAll: mockKYCAttemptFindAll
          }
        }));

        const { gdprExportData } = require('../../src/controllers/kyc.controller');

        // Act
        await gdprExportData(mockRequest as AuthRequest, mockResponse as Response, jest.fn());

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            exportDate: expect.any(Date),
            userId: 1,
            verification: expect.objectContaining({
              id: 1,
              status: 'approved'
            }),
            documents: expect.any(Array),
            attempts: expect.any(Array)
          })
        });
      });

      it('should return 401 if user is not authenticated', async () => {
        // Arrange
        mockRequest.user = undefined;
        const { gdprExportData } = require('../../src/controllers/kyc.controller');
        const mockNext = jest.fn();

        // Act
        await gdprExportData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('getMetrics', () => {
      it('should return aggregated metrics for operator', async () => {
        // Setup mock data
        const mockMetricsData = {
          verificationMetrics: {
            averageCompletionTime: 24.5,
            approvalRate: 75.5,
            rejectionRate: 24.5,
            totalVerifications: 100,
            approvedCount: 75,
            rejectedCount: 25
          },
          rejectionReasons: [
            { reason: 'Documento ilegible', count: 10, percentage: 40 },
            { reason: 'Rostro no coincide', count: 8, percentage: 32 }
          ],
          operatorMetrics: [
            {
              operatorId: 2,
              averageReviewTime: 2.5,
              totalReviews: 50,
              approvedCount: 40,
              rejectedCount: 10
            }
          ],
          pendingMetrics: {
            pendingCount: 15,
            oldestPendingDate: new Date('2024-01-01'),
            averageWaitTime: 12.5
          },
          componentSuccessRates: {
            faceMatchSuccessRate: 85.5,
            livenessSuccessRate: 90.2,
            ocrSuccessRate: 95.0,
            totalAttempts: 200,
            faceMatchSuccessCount: 171,
            livenessSuccessCount: 180,
            ocrSuccessCount: 190
          },
          fraudScoreDistribution: [
            { range: '0-10', count: 50, percentage: 50 },
            { range: '10-20', count: 30, percentage: 30 }
          ],
          generatedAt: new Date('2024-01-15')
        };

        mockGetAllMetrics.mockResolvedValue(mockMetricsData);

        mockRequest.user = {
          userId: 2,
          email: 'operator@example.com',
          role: 'operator'
        };

        const mockNext = jest.fn();

        await getMetrics(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockGetAllMetrics).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            verificationMetrics: expect.any(Object),
            rejectionReasons: expect.any(Array),
            operatorMetrics: expect.any(Array),
            pendingMetrics: expect.any(Object),
            componentSuccessRates: expect.any(Object),
            fraudScoreDistribution: expect.any(Array),
            generatedAt: expect.any(Date)
          })
        });
      });

      it('should return 401 if user is not authenticated', async () => {
        mockRequest.user = undefined;

        const mockNext = jest.fn();

        await getMetrics(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
          message: expect.stringContaining('Authentication')
        }));
      });

      it('should return 403 if user is not an operator', async () => {
        mockRequest.user = {
          userId: 1,
          email: 'user@example.com',
          role: 'cliente'
        };

        const mockNext = jest.fn();

        await getMetrics(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
          message: expect.stringContaining('operadores')
        }));
      });
    });
  });
});
