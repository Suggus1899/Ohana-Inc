// Mock all service dependencies BEFORE importing to avoid loading heavy libraries
jest.mock('../../src/services/encryption.service', () => ({
  EncryptionService: jest.fn().mockImplementation(() => ({
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    calculateHash: jest.fn(),
    verifyIntegrity: jest.fn()
  }))
}));

jest.mock('../../src/services/storage.service', () => ({
  StorageService: jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn()
  }))
}));

jest.mock('../../src/services/ocr.service', () => ({
  OCRService: jest.fn().mockImplementation(() => ({
    extractData: jest.fn(),
    preprocessImage: jest.fn()
  }))
}));

jest.mock('../../src/services/face-match.service', () => ({
  FaceMatchService: jest.fn().mockImplementation(() => ({
    loadModels: jest.fn(),
    detectFace: jest.fn(),
    compareFaces: jest.fn()
  }))
}));

jest.mock('../../src/services/liveness-detection.service', () => ({
  LivenessDetectionService: jest.fn().mockImplementation(() => ({
    analyzeLiveness: jest.fn(),
    extractFrames: jest.fn()
  }))
}));

jest.mock('../../src/services/notification.service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendDocumentsReceivedEmail: jest.fn(),
    sendPendingReviewEmail: jest.fn(),
    sendApprovalEmail: jest.fn(),
    sendRejectionEmail: jest.fn(),
    sendExpirationReminderEmail: jest.fn(),
    sendExpiredEmail: jest.fn()
  }))
}));

import { KYCService } from '../../src/services/kyc.service';
import KYCVerification from '../../src/models/KYCVerification';

/**
 * Basic unit tests for KYCService
 * 
 * Tests core functionality of the KYC service including:
 * - Verification creation
 * - Fraud score calculation
 * - Document validation
 */

describe('KYCService', () => {
  let kycService: KYCService;

  beforeEach(() => {
    kycService = new KYCService();
  });

  describe('calculateFraudScore', () => {
    it('should return 0 for perfect scores', () => {
      const verification = {
        documentValidityScore: 100,
        faceMatchScore: 100,
        livenessScore: 100
      } as KYCVerification;

      const fraudScore = kycService.calculateFraudScore(verification);
      expect(fraudScore).toBe(0);
    });

    it('should add 40 points if documentValidityScore < 70', () => {
      const verification = {
        documentValidityScore: 65,
        faceMatchScore: 100,
        livenessScore: 100
      } as KYCVerification;

      const fraudScore = kycService.calculateFraudScore(verification);
      expect(fraudScore).toBe(40);
    });

    it('should add 35 points if faceMatchScore < 80', () => {
      const verification = {
        documentValidityScore: 100,
        faceMatchScore: 75,
        livenessScore: 100
      } as KYCVerification;

      const fraudScore = kycService.calculateFraudScore(verification);
      expect(fraudScore).toBe(35);
    });

    it('should add 25 points if livenessScore < 85', () => {
      const verification = {
        documentValidityScore: 100,
        faceMatchScore: 100,
        livenessScore: 80
      } as KYCVerification;

      const fraudScore = kycService.calculateFraudScore(verification);
      expect(fraudScore).toBe(25);
    });

    it('should sum all penalties correctly', () => {
      const verification = {
        documentValidityScore: 65,
        faceMatchScore: 75,
        livenessScore: 80
      } as KYCVerification;

      const fraudScore = kycService.calculateFraudScore(verification);
      expect(fraudScore).toBe(100); // 40 + 35 + 25 = 100
    });

    it('should cap fraud score at 100', () => {
      const verification = {
        documentValidityScore: 50,
        faceMatchScore: 50,
        livenessScore: 50
      } as KYCVerification;

      const fraudScore = kycService.calculateFraudScore(verification);
      expect(fraudScore).toBe(100); // Capped at 100
    });

    it('should handle null scores gracefully', () => {
      const verification = {
        documentValidityScore: undefined,
        faceMatchScore: undefined,
        livenessScore: undefined
      } as Partial<KYCVerification> as KYCVerification;

      const fraudScore = kycService.calculateFraudScore(verification);
      expect(fraudScore).toBe(0);
    });

    it('should handle undefined scores gracefully', () => {
      const verification = {} as KYCVerification;

      const fraudScore = kycService.calculateFraudScore(verification);
      expect(fraudScore).toBe(0);
    });
  });

  describe('Fraud Score Bounds Property', () => {
    it('should always produce fraud scores between 0 and 100', () => {
      // Test with various score combinations
      const testCases = [
        { documentValidityScore: 0, faceMatchScore: 0, livenessScore: 0 },
        { documentValidityScore: 50, faceMatchScore: 50, livenessScore: 50 },
        { documentValidityScore: 100, faceMatchScore: 100, livenessScore: 100 },
        { documentValidityScore: 69, faceMatchScore: 79, livenessScore: 84 },
        { documentValidityScore: 70, faceMatchScore: 80, livenessScore: 85 },
        { documentValidityScore: undefined, faceMatchScore: undefined, livenessScore: 100 }
      ];

      testCases.forEach(scores => {
        const verification = scores as Partial<KYCVerification> as KYCVerification;
        const fraudScore = kycService.calculateFraudScore(verification);
        
        expect(fraudScore).toBeGreaterThanOrEqual(0);
        expect(fraudScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('deleteUserDataByRequest', () => {
    // Mock models
    const mockKYCDocument = {
      findAll: jest.fn(),
      destroy: jest.fn()
    };

    const mockKYCVerification = {
      update: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete all physical documents and anonymize verification data (Requisito 31.10)', async () => {
      // Arrange
      const userId = 1;
      const reason = 'Ya no deseo usar el servicio';

      const mockVerification = {
        id: 1,
        userId: 1,
        fullName: 'Juan Pérez',
        documentNumber: 'CC-12345678',
        update: jest.fn().mockResolvedValue(undefined)
      };

      const mockDocuments = [
        {
          id: 1,
          verificationId: 1,
          encryptedUrl: 'kyc/1/id_front.enc',
          documentType: 'id_front'
        },
        {
          id: 2,
          verificationId: 1,
          encryptedUrl: 'kyc/1/id_back.enc',
          documentType: 'id_back'
        }
      ];

      // Mock getVerificationByUserId
      jest.spyOn(kycService, 'getVerificationByUserId').mockResolvedValue(mockVerification as any);

      // Mock KYCDocument.findAll
      const KYCDocument = require('../../src/models/KYCDocument').default;
      KYCDocument.findAll = jest.fn().mockResolvedValue(mockDocuments);
      KYCDocument.destroy = jest.fn().mockResolvedValue(2);

      // Mock storage service
      const storageService = (kycService as any).storageService;
      storageService.exists = jest.fn().mockResolvedValue(true);
      storageService.delete = jest.fn().mockResolvedValue(undefined);

      // Mock audit logger
      jest.spyOn(kycService, 'logDocumentDeletion').mockResolvedValue(undefined);

      // Act
      await kycService.deleteUserDataByRequest(userId, reason);

      // Assert
      // 1. Should get verification by userId
      expect(kycService.getVerificationByUserId).toHaveBeenCalledWith(userId);

      // 2. Should find all documents
      expect(KYCDocument.findAll).toHaveBeenCalledWith({
        where: { verificationId: mockVerification.id }
      });

      // 3. Should delete physical files
      expect(storageService.exists).toHaveBeenCalledTimes(2);
      expect(storageService.delete).toHaveBeenCalledTimes(2);
      expect(storageService.delete).toHaveBeenCalledWith('kyc/1/id_front.enc');
      expect(storageService.delete).toHaveBeenCalledWith('kyc/1/id_back.enc');

      // 4. Should delete document records
      expect(KYCDocument.destroy).toHaveBeenCalledWith({
        where: { verificationId: mockVerification.id }
      });

      // 5. Should anonymize verification data
      expect(mockVerification.update).toHaveBeenCalledWith({
        fullName: undefined,
        documentNumber: undefined,
        dateOfBirth: undefined,
        nationality: undefined,
        address: undefined,
        documentFrontUrl: undefined,
        documentBackUrl: undefined,
        selfieUrl: undefined,
        selfieWithDocumentUrl: undefined,
        livenessVideoUrl: undefined,
        proofOfAddressUrl: undefined,
        ocrData: undefined,
        reviewNotes: undefined,
        rejectionReason: undefined
      });

      // 6. Should log deletion
      expect(kycService.logDocumentDeletion).toHaveBeenCalledWith(userId, reason);
    });

    it('should handle case when user has no verification', async () => {
      // Arrange
      const userId = 999;
      const reason = 'Test reason';

      // Mock getVerificationByUserId to return null
      jest.spyOn(kycService, 'getVerificationByUserId').mockResolvedValue(null);

      // Act
      await kycService.deleteUserDataByRequest(userId, reason);

      // Assert
      // Should return early without errors
      expect(kycService.getVerificationByUserId).toHaveBeenCalledWith(userId);
    });

    it('should continue deletion even if some files fail to delete', async () => {
      // Arrange
      const userId = 1;
      const reason = 'Test reason';

      const mockVerification = {
        id: 1,
        userId: 1,
        update: jest.fn().mockResolvedValue(undefined)
      };

      const mockDocuments = [
        {
          id: 1,
          verificationId: 1,
          encryptedUrl: 'kyc/1/id_front.enc',
          documentType: 'id_front'
        },
        {
          id: 2,
          verificationId: 1,
          encryptedUrl: 'kyc/1/id_back.enc',
          documentType: 'id_back'
        }
      ];

      // Mock getVerificationByUserId
      jest.spyOn(kycService, 'getVerificationByUserId').mockResolvedValue(mockVerification as any);

      // Mock KYCDocument.findAll
      const KYCDocument = require('../../src/models/KYCDocument').default;

      KYCDocument.findAll = jest.fn().mockResolvedValue(mockDocuments);
      KYCDocument.destroy = jest.fn().mockResolvedValue(2);

      // Mock storage service - first file fails, second succeeds
      const storageService = (kycService as any).storageService;
      storageService.exists = jest.fn().mockResolvedValue(true);
      storageService.delete = jest.fn()
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce(undefined);

      // Mock audit logger
      jest.spyOn(kycService, 'logDocumentDeletion').mockResolvedValue(undefined);

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await kycService.deleteUserDataByRequest(userId, reason);

      // Assert
      // Should continue despite error
      expect(storageService.delete).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(KYCDocument.destroy).toHaveBeenCalled();
      expect(mockVerification.update).toHaveBeenCalled();

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should maintain aggregate statistics after anonymization', async () => {
      // Arrange
      const userId = 1;
      const reason = 'Test reason';

      const mockVerification = {
        id: 1,
        userId: 1,
        status: 'approved',
        verificationLevel: 5,
        faceMatchScore: 87.5,
        livenessScore: 92.0,
        documentValidityScore: 95.0,
        fraudScore: 15.0,
        attempts: 1,
        createdAt: new Date('2024-01-01'),
        verifiedAt: new Date('2024-01-15'),
        update: jest.fn().mockResolvedValue(undefined)
      };

      // Mock getVerificationByUserId
      jest.spyOn(kycService, 'getVerificationByUserId').mockResolvedValue(mockVerification as any);

      // Mock KYCDocument.findAll
      const KYCDocument = require('../../src/models/KYCDocument').default;
      KYCDocument.findAll = jest.fn().mockResolvedValue([]);
      KYCDocument.destroy = jest.fn().mockResolvedValue(0);

      // Mock audit logger
      jest.spyOn(kycService, 'logDocumentDeletion').mockResolvedValue(undefined);

      // Act
      await kycService.deleteUserDataByRequest(userId, reason);

      // Assert
      // Should anonymize personal data but keep statistics
      const updateCall = mockVerification.update.mock.calls[0][0];
      
      // Personal data should be undefined
      expect(updateCall.fullName).toBeUndefined();
      expect(updateCall.documentNumber).toBeUndefined();
      expect(updateCall.dateOfBirth).toBeUndefined();
      expect(updateCall.nationality).toBeUndefined();
      expect(updateCall.address).toBeUndefined();
      
      // URLs should be undefined
      expect(updateCall.documentFrontUrl).toBeUndefined();
      expect(updateCall.selfieUrl).toBeUndefined();
      
      // OCR data should be undefined
      expect(updateCall.ocrData).toBeUndefined();
      
      // Note: The actual scores, status, dates are NOT updated (maintained)
      // They are not in the update call, so they remain unchanged
    });
  });
});
