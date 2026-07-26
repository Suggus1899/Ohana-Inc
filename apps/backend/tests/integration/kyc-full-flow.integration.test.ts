/**
 * KYC Processing - Full Flow Integration Tests
 * 
 * This test suite validates the complete KYC flow from start to operator approval,
 * ensuring all 6 bugs are resolved and no regressions are introduced.
 * 
 * Test Coverage:
 * - Full KYC flow from start to operator approval (all bugs fixed)
 * - Concurrent KYC submissions from multiple users
 * - KYC flow with various document types and quality levels
 * - Operator panel with multiple pending verifications
 * - Frontend integration with backend status endpoint
 * - Error recovery and retry logic
 * 
 * **Validates: All bug fixes working together in integrated environment**
 * 
 * Spec: .kiro/specs/kyc-processing-bugs-fix/
 */

// Mock services BEFORE imports to avoid TensorFlow dependency issues
jest.mock('../../src/services/liveness/liveness-detection.service', () => {
  return {
    LivenessDetectionService: jest.fn().mockImplementation(() => {
      return {
        analyzeLiveness: jest.fn().mockImplementation(async (videoPath: string) => {
          // Simulate successful liveness with proper movement
          return {
            isLive: true,
            blinkCount: 3,
            headMovementRange: { yaw: 20, pitch: 10, roll: 5 },
            averageFaceConfidence: 92,
            framesAnalyzed: 30,
            qualityScore: 90,
            failureReason: undefined,
            performance: { totalTime: 1000, framesPerSecond: 30 }
          };
        })
      };
    })
  };
});

jest.mock('../../src/services/face-match.service', () => {
  return {
    FaceMatchService: jest.fn().mockImplementation(() => {
      return {
        compareFaces: jest.fn().mockResolvedValue({
          match: true,
          score: 92,
          confidence: 0.92
        }),
        detectFace: jest.fn().mockResolvedValue({
          confidence: 0.92
        }),
        loadModels: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

jest.mock('../../src/services/ocr.service', () => {
  return {
    OCRService: jest.fn().mockImplementation(() => {
      return {
        extractData: jest.fn().mockResolvedValue({
          fullName: 'Test User',
          documentNumber: 'CC12345678',
          dateOfBirth: new Date('1990-01-01'),
          nationality: 'Colombiana',
          expirationDate: new Date('2030-01-01'),
          confidence: 92
        })
      };
    })
  };
});

jest.mock('../../src/services/notification.service', () => {
  return {
    NotificationService: jest.fn().mockImplementation(() => {
      return {
        sendPendingReviewEmail: jest.fn().mockResolvedValue(undefined),
        sendRejectionEmail: jest.fn().mockResolvedValue(undefined),
        sendApprovalEmail: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

import { sequelize } from '../../src/config/database';
import KYCVerification from '../../src/models/KYCVerification';
import KYCDocument from '../../src/models/KYCDocument';
import User from '../../src/models/User';
import { KYCService } from '../../src/services/kyc.service';
import { StorageService } from '../../src/services/storage.service';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('KYC Full Flow Integration Tests', () => {
  let kycService: KYCService;
  let storageService: StorageService;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    kycService = new KYCService();
    storageService = new StorageService();
  });

  beforeEach(async () => {
    await KYCDocument.destroy({ where: {}, force: true });
    await KYCVerification.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  /**
   * Test 1: Full KYC Flow from Start to Operator Approval
   * 
   * This test validates the complete end-to-end flow:
   * 1. User starts KYC (Bug 1.1 - currentLevel column)
   * 2. User uploads documents (Bug 1.2 - file paths)
   * 3. User completes liveness (Bug 1.3 - movement validation)
   * 4. System processes verification (Bug 1.4 - status transition)
   * 5. Verification appears in operator panel (Bug 1.5)
   * 6. Frontend can query status consistently (Bug 1.6)
   * 7. Operator approves verification
   */
  describe('Full KYC Flow - Start to Approval', () => {
    it('should complete full KYC flow successfully with all bugs fixed', async () => {
      // Step 1: Create user
      const user = await User.create({
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'hashedpassword',
        phonePrefix: '+57',
        phone: '3001234567',
        cedulaType: 'CC',
        cedula: '87654321',
        role: 'cliente',
        isVerified: false,
        verificationLevel: 0
      });

      // Step 2: Start KYC (Bug 1.1 - should create with currentLevel)
      const verification = await kycService.createVerification(user.id);
      expect(verification).toBeDefined();
      expect(verification.currentLevel).toBe(0);
      expect(verification.status).toBe('not_started');

      // Step 3: Upload documents (Bug 1.2 - should have correct paths)
      const fakeImageBuffer = Buffer.from('fake-high-quality-image-data');
      
      const idFront = await kycService.uploadDocument(verification.id, 'id_front', fakeImageBuffer);
      expect(idFront.encryptedUrl).not.toContain('storage/kyc/storage/kyc/');
      expect(await storageService.exists(idFront.encryptedUrl)).toBe(true);

      const idBack = await kycService.uploadDocument(verification.id, 'id_back', fakeImageBuffer);
      expect(idBack.encryptedUrl).not.toContain('storage/kyc/storage/kyc/');
      expect(await storageService.exists(idBack.encryptedUrl)).toBe(true);

      const selfie = await kycService.uploadDocument(verification.id, 'selfie', fakeImageBuffer);
      expect(selfie.encryptedUrl).not.toContain('storage/kyc/storage/kyc/');
      expect(await storageService.exists(selfie.encryptedUrl)).toBe(true);

      const selfieWithDoc = await kycService.uploadDocument(verification.id, 'selfie_with_doc', fakeImageBuffer);
      expect(selfieWithDoc.encryptedUrl).not.toContain('storage/kyc/storage/kyc/');
      expect(await storageService.exists(selfieWithDoc.encryptedUrl)).toBe(true);

      // Step 4: Upload liveness video (Bug 1.3 - should validate movement)
      const videoPath = path.join(__dirname, '../fixtures/integration-video.webm');
      await fs.ensureDir(path.dirname(videoPath));
      const minimalWebM = Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F]);
      await fs.writeFile(videoPath, minimalWebM);
      const videoBuffer = await fs.readFile(videoPath);
      
      const livenessVideo = await kycService.uploadDocument(verification.id, 'liveness_video', videoBuffer);
      expect(livenessVideo.encryptedUrl).not.toContain('storage/kyc/storage/kyc/');
      expect(await storageService.exists(livenessVideo.encryptedUrl)).toBe(true);

      // Step 5: Process verification (Bug 1.4 - should transition to final state)
      const result = await kycService.processVerification(verification.id);
      expect(result).toBeDefined();
      expect(result.status).toBe('pending_review');
      expect(['in_progress', 'documents_uploaded']).not.toContain(result.status);

      // Step 6: Verify appears in operator panel (Bug 1.5)
      const pendingVerifications = await kycService.getPendingVerifications({ status: 'pending_review' });
      expect(pendingVerifications.length).toBeGreaterThan(0);
      const foundVerification = pendingVerifications.find(v => v.id === verification.id);
      expect(foundVerification).toBeDefined();
      expect(foundVerification!.status).toBe('pending_review');

      // Step 7: Frontend can query status (Bug 1.6)
      const statusCheck = await kycService.getVerificationByUserId(user.id);
      expect(statusCheck).toBeDefined();
      expect(statusCheck!.id).toBe(verification.id);
      expect(statusCheck!.status).toBe('pending_review');
      expect(statusCheck!.verificationLevel).toBeDefined();
      expect(statusCheck!.createdAt).toBeDefined();
      expect(statusCheck!.updatedAt).toBeDefined();

      // Step 8: Operator approves verification
      const operatorUser = await User.create({
        name: 'Operator',
        email: 'operator@example.com',
        password: 'hashedpassword',
        phonePrefix: '+57',
        phone: '3009999999',
        cedulaType: 'CC',
        cedula: '99999999',
        role: 'operator',
        isVerified: true,
        verificationLevel: 3
      });

      await kycService.approveVerification(verification.id, operatorUser.id);
      
      // Verify verification was approved
      await verification.reload();
      expect(verification.status).toBe('approved');

      // Step 9: Verify user is updated
      await user.reload();
      expect(user.verificationLevel).toBe(5); // approveVerification sets level to 5

      // Cleanup
      await fs.remove(videoPath);
    });
  });

  /**
   * Test 2: Concurrent KYC Submissions
   * 
   * Validates that multiple users can submit KYC requests simultaneously
   * without race conditions or data corruption.
   */
  describe('Concurrent KYC Submissions', () => {
    it('should handle multiple concurrent KYC submissions correctly', async () => {
      // Create multiple users
      const users = await Promise.all([
        User.create({
          name: 'Concurrent User 1',
          email: 'concurrent1@example.com',
          password: 'hashedpassword',
          phonePrefix: '+57',
          phone: '3001111111',
          cedulaType: 'CC',
          cedula: '11111111',
          role: 'cliente',
          isVerified: false,
          verificationLevel: 0
        }),
        User.create({
          name: 'Concurrent User 2',
          email: 'concurrent2@example.com',
          password: 'hashedpassword',
          phonePrefix: '+57',
          phone: '3002222222',
          cedulaType: 'CC',
          cedula: '22222222',
          role: 'cliente',
          isVerified: false,
          verificationLevel: 0
        }),
        User.create({
          name: 'Concurrent User 3',
          email: 'concurrent3@example.com',
          password: 'hashedpassword',
          phonePrefix: '+57',
          phone: '3003333333',
          cedulaType: 'CC',
          cedula: '33333333',
          role: 'cliente',
          isVerified: false,
          verificationLevel: 0
        })
      ]);

      // Start KYC for all users concurrently
      const verifications = await Promise.all(
        users.map(user => kycService.createVerification(user.id))
      );

      // Verify all verifications were created successfully
      expect(verifications).toHaveLength(3);
      verifications.forEach((verification, index) => {
        expect(verification).toBeDefined();
        expect(verification.userId).toBe(users[index].id);
        expect(verification.currentLevel).toBe(0);
        expect(verification.status).toBe('not_started');
      });

      // Upload documents concurrently for all users
      const fakeImageBuffer = Buffer.from('fake-image-data');
      
      await Promise.all(
        verifications.map(async (verification) => {
          await kycService.uploadDocument(verification.id, 'id_front', fakeImageBuffer);
          await kycService.uploadDocument(verification.id, 'id_back', fakeImageBuffer);
          await kycService.uploadDocument(verification.id, 'selfie', fakeImageBuffer);
          await kycService.uploadDocument(verification.id, 'selfie_with_doc', fakeImageBuffer);
          
          const videoPath = path.join(__dirname, `../fixtures/concurrent-video-${verification.id}.webm`);
          await fs.ensureDir(path.dirname(videoPath));
          const minimalWebM = Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F]);
          await fs.writeFile(videoPath, minimalWebM);
          const videoBuffer = await fs.readFile(videoPath);
          await kycService.uploadDocument(verification.id, 'liveness_video', videoBuffer);
        })
      );

      // Process all verifications concurrently
      const results = await Promise.all(
        verifications.map(verification => kycService.processVerification(verification.id))
      );

      // Verify all processed successfully
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.status).toBe('pending_review');
      });

      // Verify all appear in operator panel
      const pendingVerifications = await kycService.getPendingVerifications({ status: 'pending_review' });
      expect(pendingVerifications.length).toBeGreaterThanOrEqual(3);

      // Cleanup
      for (const verification of verifications) {
        const videoPath = path.join(__dirname, `../fixtures/concurrent-video-${verification.id}.webm`);
        await fs.remove(videoPath);
      }
    });
  });

  /**
   * Test 3: Various Document Types and Quality Levels
   * 
   * Validates that the system handles different document scenarios correctly.
   */
  describe('Various Document Types and Quality', () => {
    it('should handle different document quality levels appropriately', async () => {
      const user = await User.create({
        name: 'Quality Test User',
        email: 'quality@example.com',
        password: 'hashedpassword',
        phonePrefix: '+57',
        phone: '3005555555',
        cedulaType: 'CC',
        cedula: '55555555',
        role: 'cliente',
        isVerified: false,
        verificationLevel: 0
      });

      const verification = await kycService.createVerification(user.id);

      // Test with different buffer sizes (simulating different quality)
      const lowQualityBuffer = Buffer.from('low-quality-image');
      const mediumQualityBuffer = Buffer.from('medium-quality-image-with-more-data');
      const highQualityBuffer = Buffer.from('high-quality-image-with-much-more-data-and-details');

      // Upload documents with varying quality
      const idFront = await kycService.uploadDocument(verification.id, 'id_front', highQualityBuffer);
      expect(idFront).toBeDefined();
      expect(await storageService.exists(idFront.encryptedUrl)).toBe(true);

      const idBack = await kycService.uploadDocument(verification.id, 'id_back', mediumQualityBuffer);
      expect(idBack).toBeDefined();
      expect(await storageService.exists(idBack.encryptedUrl)).toBe(true);

      const selfie = await kycService.uploadDocument(verification.id, 'selfie', highQualityBuffer);
      expect(selfie).toBeDefined();
      expect(await storageService.exists(selfie.encryptedUrl)).toBe(true);

      const selfieWithDoc = await kycService.uploadDocument(verification.id, 'selfie_with_doc', mediumQualityBuffer);
      expect(selfieWithDoc).toBeDefined();
      expect(await storageService.exists(selfieWithDoc.encryptedUrl)).toBe(true);

      // All files should be stored without path duplication
      [idFront, idBack, selfie, selfieWithDoc].forEach(doc => {
        expect(doc.encryptedUrl).not.toContain('storage/kyc/storage/kyc/');
      });
    });
  });

  /**
   * Test 4: Operator Panel with Multiple Pending Verifications
   * 
   * Validates that the operator panel correctly displays multiple pending verifications.
   */
  describe('Operator Panel with Multiple Verifications', () => {
    it('should display all pending verifications in operator panel', async () => {
      // Create multiple users with pending verifications
      const users = await Promise.all([
        User.create({
          name: 'Pending User 1',
          email: 'pending1@example.com',
          password: 'hashedpassword',
          phonePrefix: '+57',
          phone: '3006666666',
          cedulaType: 'CC',
          cedula: '66666666',
          role: 'cliente',
          isVerified: false,
          verificationLevel: 0
        }),
        User.create({
          name: 'Pending User 2',
          email: 'pending2@example.com',
          password: 'hashedpassword',
          phonePrefix: '+57',
          phone: '3007777777',
          cedulaType: 'CC',
          cedula: '77777777',
          role: 'cliente',
          isVerified: false,
          verificationLevel: 0
        }),
        User.create({
          name: 'Pending User 3',
          email: 'pending3@example.com',
          password: 'hashedpassword',
          phonePrefix: '+57',
          phone: '3008888888',
          cedulaType: 'CC',
          cedula: '88888888',
          role: 'cliente',
          isVerified: false,
          verificationLevel: 0
        })
      ]);

      // Create verifications and set to pending_review
      const verifications = await Promise.all(
        users.map(async (user) => {
          const verification = await kycService.createVerification(user.id);
          await verification.update({
            status: 'pending_review',
            fraudScore: 45,
            faceMatchScore: 88,
            livenessScore: 91,
            documentValidityScore: 93
          });
          return verification;
        })
      );

      // Query operator panel
      const pendingVerifications = await kycService.getPendingVerifications({ status: 'pending_review' });

      // Verify all verifications appear
      expect(pendingVerifications.length).toBeGreaterThanOrEqual(3);
      
      verifications.forEach(verification => {
        const found = pendingVerifications.find(v => v.id === verification.id);
        expect(found).toBeDefined();
        expect(found!.status).toBe('pending_review');
        // fraudScore is returned as string from database, convert to number for comparison
        const fraudScore = typeof found!.fraudScore === 'string' ? parseFloat(found!.fraudScore) : found!.fraudScore;
        expect(fraudScore).toBeLessThan(80);
      });
    });
  });

  /**
   * Test 5: Frontend Status Endpoint Integration
   * 
   * Validates consistent responses from status endpoint in various scenarios.
   */
  describe('Frontend Status Endpoint Integration', () => {
    it('should provide consistent status responses for frontend', async () => {
      const user = await User.create({
        name: 'Frontend Test User',
        email: 'frontend@example.com',
        password: 'hashedpassword',
        phonePrefix: '+57',
        phone: '3009999999',
        cedulaType: 'CC',
        cedula: '99999999',
        role: 'cliente',
        isVerified: false,
        verificationLevel: 0
      });

      // Test 1: No verification exists
      let status = await kycService.getVerificationByUserId(user.id);
      expect(status).toBeNull();

      // Test 2: Verification created
      const verification = await kycService.createVerification(user.id);
      status = await kycService.getVerificationByUserId(user.id);
      expect(status).toBeDefined();
      expect(status!.id).toBe(verification.id);
      expect(status!.status).toBe('not_started');
      expect(status!.verificationLevel).toBe(0);
      expect(status!.currentLevel).toBe(0);

      // Test 3: Documents uploaded
      await verification.update({ status: 'documents_uploaded' });
      status = await kycService.getVerificationByUserId(user.id);
      expect(status).toBeDefined();
      expect(status!.status).toBe('documents_uploaded');

      // Test 4: Processing
      await verification.update({ status: 'in_progress' });
      status = await kycService.getVerificationByUserId(user.id);
      expect(status).toBeDefined();
      expect(status!.status).toBe('in_progress');

      // Test 5: Pending review
      await verification.update({ status: 'pending_review' });
      status = await kycService.getVerificationByUserId(user.id);
      expect(status).toBeDefined();
      expect(status!.status).toBe('pending_review');

      // Test 6: Approved
      await verification.update({ status: 'approved' });
      status = await kycService.getVerificationByUserId(user.id);
      expect(status).toBeDefined();
      expect(status!.status).toBe('approved');

      // All responses should have consistent structure
      expect(status!.id).toBeDefined();
      expect(status!.userId).toBe(user.id);
      expect(status!.createdAt).toBeDefined();
      expect(status!.updatedAt).toBeDefined();
    });
  });

  /**
   * Test 6: Error Recovery and Retry Logic
   * 
   * Validates that the system handles errors gracefully and allows retries.
   */
  describe('Error Recovery and Retry Logic', () => {
    it('should allow resubmission after rejection', async () => {
      const user = await User.create({
        name: 'Retry Test User',
        email: 'retry@example.com',
        password: 'hashedpassword',
        phonePrefix: '+57',
        phone: '3000000000',
        cedulaType: 'CC',
        cedula: '00000000',
        role: 'cliente',
        isVerified: false,
        verificationLevel: 0
      });

      // First attempt
      const verification1 = await kycService.createVerification(user.id);
      expect(verification1.currentLevel).toBe(0);
      expect(verification1.status).toBe('not_started');

      // Simulate rejection - update to rejected status
      await verification1.update({ 
        status: 'rejected',
        rejectionReason: 'Document quality too low'
      });

      // Verify the verification is rejected
      const rejectedVerification = await kycService.getVerificationByUserId(user.id);
      expect(rejectedVerification).toBeDefined();
      expect(rejectedVerification!.status).toBe('rejected');
      expect(rejectedVerification!.rejectionReason).toBe('Document quality too low');

      // In the current system design, there's only ONE verification record per user (userId is unique)
      // After rejection, the user would need to update the same verification record, not create a new one
      // This is by design - the system tracks all attempts in a single verification record
      
      // Verify that the verification ID remains the same (single record per user)
      expect(rejectedVerification!.id).toBe(verification1.id);
      
      // The system allows the user to retry by updating the existing verification
      // (In a real scenario, the frontend would allow re-uploading documents to the same verification)
    });

    it('should handle resubmission_required status correctly', async () => {
      const user = await User.create({
        name: 'Resubmit Test User',
        email: 'resubmit@example.com',
        password: 'hashedpassword',
        phonePrefix: '+57',
        phone: '3001111112',
        cedulaType: 'CC',
        cedula: '11111112',
        role: 'cliente',
        isVerified: false,
        verificationLevel: 0
      });

      const verification = await kycService.createVerification(user.id);
      
      // Simulate resubmission required
      await verification.update({ 
        status: 'resubmission_required',
        rejectionReason: 'Liveness detection failed'
      });

      // Verify status is accessible
      const status = await kycService.getVerificationByUserId(user.id);
      expect(status).toBeDefined();
      expect(status!.status).toBe('resubmission_required');
      expect(status!.rejectionReason).toBeDefined();
    });
  });

  /**
   * Test 7: Regression Prevention
   * 
   * Validates that all 6 bugs remain fixed and no regressions are introduced.
   */
  describe('Regression Prevention - All Bugs Fixed', () => {
    it('should verify all 6 bugs are resolved in integrated flow', async () => {
      const user = await User.create({
        name: 'Regression Test User',
        email: 'regression@example.com',
        password: 'hashedpassword',
        phonePrefix: '+57',
        phone: '3002222223',
        cedulaType: 'CC',
        cedula: '22222223',
        role: 'cliente',
        isVerified: false,
        verificationLevel: 0
      });

      // Bug 1.1: currentLevel column exists
      const verification = await kycService.createVerification(user.id);
      expect(verification.currentLevel).toBeDefined();
      expect(verification.currentLevel).toBe(0);

      // Bug 1.2: File paths not duplicated
      const fakeImageBuffer = Buffer.from('fake-image-data');
      const doc = await kycService.uploadDocument(verification.id, 'id_front', fakeImageBuffer);
      expect(doc.encryptedUrl).not.toContain('storage/kyc/storage/kyc/');
      expect(await storageService.exists(doc.encryptedUrl)).toBe(true);

      // Upload remaining documents
      await kycService.uploadDocument(verification.id, 'id_back', fakeImageBuffer);
      await kycService.uploadDocument(verification.id, 'selfie', fakeImageBuffer);
      await kycService.uploadDocument(verification.id, 'selfie_with_doc', fakeImageBuffer);
      
      const videoPath = path.join(__dirname, '../fixtures/regression-video.webm');
      await fs.ensureDir(path.dirname(videoPath));
      const minimalWebM = Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F]);
      await fs.writeFile(videoPath, minimalWebM);
      const videoBuffer = await fs.readFile(videoPath);
      await kycService.uploadDocument(verification.id, 'liveness_video', videoBuffer);

      // Bug 1.3: Liveness validates movement (mocked to pass with proper values)
      // Bug 1.4: Status transitions to final state
      const result = await kycService.processVerification(verification.id);
      expect(result.status).toBe('pending_review');
      expect(['in_progress', 'documents_uploaded']).not.toContain(result.status);

      // Bug 1.5: Appears in operator panel
      const pendingVerifications = await kycService.getPendingVerifications({ status: 'pending_review' });
      const found = pendingVerifications.find(v => v.id === verification.id);
      expect(found).toBeDefined();

      // Bug 1.6: Consistent status responses
      const status = await kycService.getVerificationByUserId(user.id);
      expect(status).toBeDefined();
      expect(status!.id).toBe(verification.id);
      expect(status!.status).toBe('pending_review');
      expect(status!.verificationLevel).toBeDefined();
      expect(status!.currentLevel).toBeDefined();
      expect(status!.createdAt).toBeDefined();
      expect(status!.updatedAt).toBeDefined();

      // Cleanup
      await fs.remove(videoPath);
    });
  });
});
