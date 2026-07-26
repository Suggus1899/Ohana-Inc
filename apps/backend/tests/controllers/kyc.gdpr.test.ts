/**
 * Integration tests for GDPR endpoints
 * 
 * Tests the GDPR compliance endpoints:
 * - GET /api/kyc/gdpr/access (Requisito 31.6)
 * - POST /api/kyc/gdpr/rectify (Requisito 31.7)
 * - POST /api/kyc/gdpr/delete (Requisito 31.8, 31.10)
 * - GET /api/kyc/gdpr/export (Requisito 31.9)
 */

// Mock KYCService before importing controller
jest.mock('../../src/services/kyc.service', () => ({
  KYCService: jest.fn().mockImplementation(() => ({
    deleteUserDataByRequest: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock the models
jest.mock('../../src/models/KYCVerification');
jest.mock('../../src/models/KYCDocument');
jest.mock('../../src/models/KYCAttempt');

// Mock audit logger
jest.mock('../../src/services/audit-logger.service', () => ({
  auditLogger: {
    logGDPRRequest: jest.fn(),
    logAuditEvent: jest.fn()
  }
}));

import { Response, NextFunction } from 'express';
import { gdprAccessData, gdprRectifyData, gdprDeleteData, gdprExportData } from '../../src/controllers/kyc.controller';
import { AuthRequest } from '../../src/types';
import KYCVerification from '../../src/models/KYCVerification';
import KYCDocument from '../../src/models/KYCDocument';
import KYCAttempt from '../../src/models/KYCAttempt';
import { auditLogger } from '../../src/services/audit-logger.service';

describe('GDPR Endpoints', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        userId: 1,
        email: 'test@example.com',
        role: 'cliente'
      },
      ip: '127.0.0.1',
      socket: {
        remoteAddress: '127.0.0.1'
      } as any
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('gdprAccessData - GET /api/kyc/gdpr/access', () => {
    it('should return all user KYC data successfully (Requisito 31.6)', async () => {
      // Arrange
      const mockVerification = {
        id: 1,
        userId: 1,
        status: 'approved',
        verificationLevel: 5,
        fullName: 'Juan Pérez',
        documentNumber: 'CC-12345678',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'Colombiana',
        address: 'Calle Principal 123',
        faceMatchScore: 87.5,
        livenessScore: 92.0,
        documentValidityScore: 95.0,
        fraudScore: 15.0,
        ocrData: { confidence: 0.95 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        consentedAt: new Date('2024-01-01')
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

      (KYCVerification.findOne as jest.Mock).mockResolvedValue(mockVerification);
      (KYCDocument.findAll as jest.Mock).mockResolvedValue(mockDocuments);
      (KYCAttempt.findAll as jest.Mock).mockResolvedValue(mockAttempts);

      // Act
      await gdprAccessData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(auditLogger.logGDPRRequest).toHaveBeenCalledWith(1, 'access', '127.0.0.1');
      expect(KYCVerification.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          verification: expect.objectContaining({
            id: 1,
            userId: 1,
            status: 'approved',
            fullName: 'Juan Pérez'
          }),
          documents: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              documentType: 'id_front'
            })
          ]),
          attempts: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              step: 'document_capture'
            })
          ])
        })
      });
    });

    it('should return null verification if user has no KYC data', async () => {
      // Arrange
      (KYCVerification.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await gdprAccessData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          verification: null,
          documents: [],
          attempts: []
        }
      });
    });

    it('should call next with error if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await gdprAccessData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('gdprRectifyData - POST /api/kyc/gdpr/rectify', () => {
    it('should accept rectification request successfully (Requisito 31.7)', async () => {
      // Arrange
      mockRequest.body = {
        field: 'fullName',
        currentValue: 'Juan Perez',
        requestedValue: 'Juan Pérez',
        reason: 'Corrección de acento en apellido'
      };

      // Act
      await gdprRectifyData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(auditLogger.logGDPRRequest).toHaveBeenCalledWith(1, 'rectification', '127.0.0.1');
      expect(auditLogger.logAuditEvent).toHaveBeenCalledWith(
        'gdpr_rectification_request',
        1,
        expect.objectContaining({
          field: 'fullName',
          requestedValue: 'Juan Pérez',
          reason: 'Corrección de acento en apellido'
        }),
        '127.0.0.1'
      );
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

    it('should call next with error if required fields are missing', async () => {
      // Arrange
      mockRequest.body = {
        field: 'fullName'
        // Missing requestedValue and reason
      };

      // Act
      await gdprRectifyData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should call next with error if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = {
        field: 'fullName',
        requestedValue: 'Juan Pérez',
        reason: 'Corrección'
      };

      // Act
      await gdprRectifyData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('gdprDeleteData - POST /api/kyc/gdpr/delete', () => {
    it('should schedule data deletion successfully (Requisito 31.8, 31.10)', async () => {
      // Arrange
      mockRequest.body = {
        reason: 'Ya no deseo usar el servicio'
      };

      // Act
      await gdprDeleteData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(auditLogger.logGDPRRequest).toHaveBeenCalledWith(1, 'erasure', '127.0.0.1');
      expect(auditLogger.logAuditEvent).toHaveBeenCalledWith(
        'gdpr_deletion_request',
        1,
        expect.objectContaining({
          reason: 'Ya no deseo usar el servicio',
          scheduledDeletionDate: expect.any(Date)
        }),
        '127.0.0.1'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.success).toBe(true);
      expect(responseCall.data.message).toContain('Solicitud de eliminación recibida');
      expect(responseCall.data.reason).toBe('Ya no deseo usar el servicio');
      
      // Verify deletion is scheduled for 30 days from now (Requisito 31.10)
      const deletionDate = new Date(responseCall.data.scheduledDeletionDate);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);
      
      // Allow 1 second tolerance for test execution time
      const timeDiff = Math.abs(deletionDate.getTime() - expectedDate.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should call next with error if reason is missing', async () => {
      // Arrange
      mockRequest.body = {};

      // Act
      await gdprDeleteData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should call next with error if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = {
        reason: 'Ya no deseo usar el servicio'
      };

      // Act
      await gdprDeleteData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('gdprExportData - GET /api/kyc/gdpr/export', () => {
    it('should export user data in JSON format successfully (Requisito 31.9)', async () => {
      // Arrange
      const mockVerification = {
        id: 1,
        userId: 1,
        status: 'approved',
        verificationLevel: 5,
        fullName: 'Juan Pérez',
        documentNumber: 'CC-12345678',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'Colombiana',
        address: 'Calle Principal 123',
        faceMatchScore: 87.5,
        livenessScore: 92.0,
        documentValidityScore: 95.0,
        fraudScore: 15.0,
        ocrData: { confidence: 0.95 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        consentedAt: new Date('2024-01-01')
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

      (KYCVerification.findOne as jest.Mock).mockResolvedValue(mockVerification);
      (KYCDocument.findAll as jest.Mock).mockResolvedValue(mockDocuments);
      (KYCAttempt.findAll as jest.Mock).mockResolvedValue(mockAttempts);

      // Act
      await gdprExportData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(auditLogger.logGDPRRequest).toHaveBeenCalledWith(1, 'portability', '127.0.0.1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          exportDate: expect.any(Date),
          userId: 1,
          verification: expect.objectContaining({
            id: 1,
            status: 'approved',
            fullName: 'Juan Pérez'
          }),
          documents: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              documentType: 'id_front'
            })
          ]),
          attempts: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              step: 'document_capture'
            })
          ])
        })
      });
    });

    it('should export empty data if user has no KYC data', async () => {
      // Arrange
      (KYCVerification.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await gdprExportData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          exportDate: expect.any(Date),
          userId: 1,
          verification: null,
          documents: [],
          attempts: []
        })
      });
    });

    it('should call next with error if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await gdprExportData(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
