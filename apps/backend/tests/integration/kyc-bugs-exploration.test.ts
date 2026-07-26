/**
 * KYC Processing Bugs - Bug Condition Exploration Tests
 * 
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failures confirm that the bugs exist and provide counterexamples.
 * 
 * DO NOT fix the tests or the code when they fail - that's the expected behavior!
 * 
 * **Validates: Requirements 1.1-1.6, 2.1-2.6**
 * 
 * Spec: .kiro/specs/kyc-processing-bugs-fix/
 */

import { sequelize } from '../../src/config/database';
import KYCVerification from '../../src/models/KYCVerification';
import KYCDocument from '../../src/models/KYCDocument';
import User from '../../src/models/User';
import { KYCService } from '../../src/services/kyc.service';
import { StorageService } from '../../src/services/storage.service';
import { EncryptionService } from '../../src/services/encryption.service';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock the liveness detection service to avoid TensorFlow dependency issues
// but simulate the REAL validation logic
jest.mock('../../src/services/liveness/liveness-detection.service', () => {
  return {
    LivenessDetectionService: jest.fn().mockImplementation(() => {
      return {
        analyzeLiveness: jest.fn().mockImplementation(async (videoPath: string) => {
          // Simulate real validation logic:
          // - Check if video has sufficient blinks (>= 2)
          // - Check if video has sufficient head movement (>= 15 degrees)
          // For static videos (like the test video), both should be 0
          const blinkCount = 0; // Static video has no blinks
          const headMovementRange = 0; // Static video has no head movement
          const MIN_BLINKS_REQUIRED = 2;
          const HEAD_MOVEMENT_THRESHOLD = 15;
          
          const hasEnoughBlinks = blinkCount >= MIN_BLINKS_REQUIRED;
          const hasEnoughHeadMovement = headMovementRange >= HEAD_MOVEMENT_THRESHOLD;
          const isLive = hasEnoughBlinks && hasEnoughHeadMovement;
          
          // If not live, throw error like the real service does
          if (!isLive) {
            let failureReason = '';
            if (!hasEnoughBlinks && !hasEnoughHeadMovement) {
              failureReason = `Insufficient blinks (${blinkCount}/${MIN_BLINKS_REQUIRED}) and head movement (${headMovementRange}°/${HEAD_MOVEMENT_THRESHOLD}°)`;
            } else if (!hasEnoughBlinks) {
              failureReason = `Insufficient blinks (${blinkCount}/${MIN_BLINKS_REQUIRED})`;
            } else {
              failureReason = `Insufficient head movement (${headMovementRange}°/${HEAD_MOVEMENT_THRESHOLD}°)`;
            }
            
            const error: any = new Error(`Liveness validation failed: ${failureReason}`);
            error.code = 'LIVENESS_FAILED';
            error.details = {
              blinkCount,
              headMovementRange,
              averageFaceConfidence: 90,
              qualityScore: 90,
              failureReason
            };
            throw error;
          }
          
          return {
            isLive: true,
            blinkCount,
            headMovementRange,
            averageFaceConfidence: 90,
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

// Mock face match service
jest.mock('../../src/services/face-match.service', () => {
  return {
    FaceMatchService: jest.fn().mockImplementation(() => {
      return {
        compareFaces: jest.fn().mockResolvedValue({
          match: true,
          score: 90,
          confidence: 0.9
        }),
        detectFace: jest.fn().mockResolvedValue({
          confidence: 0.9
        }),
        loadModels: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

// Mock OCR service
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
          confidence: 90
        })
      };
    })
  };
});

// Mock notification service to avoid email sending errors
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

describe('KYC Processing Bugs - Exploration Tests', () => {
  let kycService: KYCService;
  let storageService: StorageService;
  let encryptionService: EncryptionService;
  let testUser: User;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
    
    // Initialize services
    kycService = new KYCService();
    storageService = new StorageService();
    encryptionService = new EncryptionService();
  });

  beforeEach(async () => {
    // Clean database before each test
    await KYCDocument.destroy({ where: {}, force: true });
    await KYCVerification.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      phonePrefix: '+57',
      phone: '3001234567',
      cedulaType: 'CC',
      cedula: '12345678',
      role: 'cliente',
      isVerified: false,
      verificationLevel: 0
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  /**
   * Bug 1.1 - Column 'currentLevel' Does Not Exist Test
   * 
   * EXPECTED OUTCOME on UNFIXED code: Test FAILS with error 500 
   * "column 'currentLevel' does not exist"
   * 
   * This test attempts to create a KYC verification which should set currentLevel: 0.
   * If the migration hasn't been executed, the database will throw an error.
   * 
   * **Validates: Requirements 1.1, 2.1**
   */
  describe('Bug 1.1 - Column currentLevel Does Not Exist', () => {
    it('should create verification with currentLevel field without database errors', async () => {
      // Attempt to create verification
      const verification = await kycService.createVerification(testUser.id);

      // Assert: Verification should be created successfully
      expect(verification).toBeDefined();
      expect(verification.id).toBeDefined();
      expect(verification.userId).toBe(testUser.id);
      expect(verification.status).toBe('not_started');
      
      // Assert: currentLevel should exist and be set to 0
      expect(verification.currentLevel).toBeDefined();
      expect(verification.currentLevel).toBe(0);

      // Verify in database that the column exists
      const dbVerification = await KYCVerification.findByPk(verification.id);
      expect(dbVerification).toBeDefined();
      expect(dbVerification!.currentLevel).toBe(0);
    });
  });

  /**
   * Bug 1.2 - Duplicated File Paths Test
   * 
   * EXPECTED OUTCOME on UNFIXED code: Test FAILS - path contains 
   * 'storage/kyc/storage/kyc/', file read fails with ENOENT
   * 
   * This test uploads a document and checks if the stored path is correct.
   * If there's double path joining, the path will be duplicated.
   * 
   * **Validates: Requirements 1.2, 2.2**
   */
  describe('Bug 1.2 - Duplicated File Paths', () => {
    it('should store files with correct unique paths without duplication', async () => {
      // Create verification
      const verification = await kycService.createVerification(testUser.id);

      // Create a test image buffer
      const testImageBuffer = Buffer.from('fake-image-data');

      // Upload document
      const document = await kycService.uploadDocument(
        verification.id,
        'id_front',
        testImageBuffer
      );

      // Assert: Document should be created
      expect(document).toBeDefined();
      expect(document.encryptedUrl).toBeDefined();

      // Assert: Path should NOT contain duplicated 'storage/kyc/storage/kyc/'
      expect(document.encryptedUrl).not.toContain('storage/kyc/storage/kyc/');
      
      // Assert: Path should be in format: storage/kyc/{id}-{type}-{timestamp}.enc
      // or just: {id}-{type}-{timestamp}.enc (depending on implementation)
      const pathPattern = /^\d+-id_front-\d+\.enc$/;
      const fullPathPattern = /^storage\/kyc\/\d+-id_front-\d+\.enc$/;
      
      const isValidPath = pathPattern.test(document.encryptedUrl) || 
                         fullPathPattern.test(document.encryptedUrl);
      expect(isValidPath).toBe(true);

      // Assert: File should be readable using the stored path
      const fileExists = await storageService.exists(document.encryptedUrl);
      expect(fileExists).toBe(true);

      // Assert: Should be able to read the file without ENOENT errors
      await expect(storageService.get(document.encryptedUrl)).resolves.toBeDefined();
    });
  });

  /**
   * Bug 1.3 - Automatic Liveness Without Movement Test
   * 
   * EXPECTED OUTCOME on UNFIXED code: Test FAILS - liveness passes 
   * when it should fail for static videos
   * 
   * This test processes a verification with a static video (no blinks, no head movement).
   * The liveness detection should FAIL, but on unfixed code it passes automatically.
   * 
   * **Validates: Requirements 1.3, 2.3**
   */
  describe('Bug 1.3 - Automatic Liveness Without Movement', () => {
    it('should fail liveness detection for videos without real movement', async () => {
      // Create verification
      const verification = await kycService.createVerification(testUser.id);

      // Create fake document buffers
      const fakeImageBuffer = Buffer.from('fake-image-data');
      
      // Upload required documents
      await kycService.uploadDocument(verification.id, 'id_front', fakeImageBuffer);
      await kycService.uploadDocument(verification.id, 'id_back', fakeImageBuffer);
      await kycService.uploadDocument(verification.id, 'selfie', fakeImageBuffer);
      await kycService.uploadDocument(verification.id, 'selfie_with_doc', fakeImageBuffer);
      
      // Create a minimal static video file (no real movement)
      // This simulates a video where the user doesn't blink or move their head
      const staticVideoPath = path.join(__dirname, '../fixtures/static-video.webm');
      await fs.ensureDir(path.dirname(staticVideoPath));
      
      // Create a minimal WebM file (just header, no actual video content needed for this test)
      const minimalWebM = Buffer.from([
        0x1A, 0x45, 0xDF, 0xA3, // EBML header
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F
      ]);
      await fs.writeFile(staticVideoPath, minimalWebM);
      
      const staticVideoBuffer = await fs.readFile(staticVideoPath);
      await kycService.uploadDocument(verification.id, 'liveness_video', staticVideoBuffer);

      // Process verification
      const result = await kycService.processVerification(verification.id);

      // Assert: Liveness should FAIL for static video
      // On unfixed code, this will pass incorrectly
      expect(result.livenessScore).toBeDefined();
      
      // Liveness score should be low (< 85) for static video
      expect(result.livenessScore!).toBeLessThan(85);
      
      // Should have errors related to liveness failure
      expect(result.errors).toBeDefined();
      const hasLivenessError = result.errors!.some(err => 
        err.includes('LIVENESS') || err.includes('movement') || err.includes('detección de vida')
      );
      expect(hasLivenessError).toBe(true);

      // Clean up
      await fs.remove(staticVideoPath);
    });
  });

  /**
   * Bug 1.4 - Infinite Processing State Test
   * 
   * EXPECTED OUTCOME on UNFIXED code: Test FAILS - status remains 
   * 'documents_uploaded' or 'in_progress' indefinitely
   * 
   * This test completes all KYC steps and verifies that the status
   * transitions to a final state (pending_review or resubmission_required).
   * 
   * **Validates: Requirements 1.4, 2.4**
   */
  describe('Bug 1.4 - Infinite Processing State', () => {
    it('should transition to final state after processing completes', async () => {
      // Create verification
      const verification = await kycService.createVerification(testUser.id);

      // Upload all required documents
      const fakeImageBuffer = Buffer.from('fake-image-data');
      await kycService.uploadDocument(verification.id, 'id_front', fakeImageBuffer);
      await kycService.uploadDocument(verification.id, 'id_back', fakeImageBuffer);
      await kycService.uploadDocument(verification.id, 'selfie', fakeImageBuffer);
      await kycService.uploadDocument(verification.id, 'selfie_with_doc', fakeImageBuffer);
      
      // Create minimal video
      const videoPath = path.join(__dirname, '../fixtures/test-video.webm');
      await fs.ensureDir(path.dirname(videoPath));
      const minimalWebM = Buffer.from([
        0x1A, 0x45, 0xDF, 0xA3,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F
      ]);
      await fs.writeFile(videoPath, minimalWebM);
      const videoBuffer = await fs.readFile(videoPath);
      await kycService.uploadDocument(verification.id, 'liveness_video', videoBuffer);

      // Process verification
      const result = await kycService.processVerification(verification.id);

      // Assert: Processing should complete
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();

      // Assert: Status should be in a FINAL state, not stuck in processing
      const finalStates = ['pending_review', 'approved', 'rejected', 'resubmission_required'];
      expect(finalStates).toContain(result.status);

      // Assert: Status should NOT be in processing states
      const processingStates = ['in_progress', 'documents_uploaded'];
      expect(processingStates).not.toContain(result.status);

      // Verify in database
      const updatedVerification = await KYCVerification.findByPk(verification.id);
      expect(updatedVerification).toBeDefined();
      expect(finalStates).toContain(updatedVerification!.status);
      expect(processingStates).not.toContain(updatedVerification!.status);

      // Clean up
      await fs.remove(videoPath);
    });
  });

  /**
   * Bug 1.5 - Requests Not Appearing in Operator Panel Test
   * 
   * EXPECTED OUTCOME on UNFIXED code: Test FAILS - verification not 
   * in returned list despite being in pending_review status
   * 
   * This test creates a verification with pending_review status and
   * verifies it appears in the operator panel query.
   * 
   * **Validates: Requirements 1.5, 2.5**
   */
  describe('Bug 1.5 - Requests Not Appearing in Operator Panel', () => {
    it('should return pending verifications in operator panel query', async () => {
      // Create verification
      const verification = await kycService.createVerification(testUser.id);

      // Manually set to pending_review with low fraud score
      await verification.update({
        status: 'pending_review',
        fraudScore: 50, // < 80, should appear in panel
        faceMatchScore: 85,
        livenessScore: 90,
        documentValidityScore: 95
      });

      // Query pending verifications (as operator would)
      const pendingVerifications = await kycService.getPendingVerifications({
        status: 'pending_review'
      });

      // Assert: Should return at least one verification
      expect(pendingVerifications).toBeDefined();
      expect(Array.isArray(pendingVerifications)).toBe(true);
      expect(pendingVerifications.length).toBeGreaterThan(0);

      // Assert: Our verification should be in the list
      const foundVerification = pendingVerifications.find(v => v.id === verification.id);
      expect(foundVerification).toBeDefined();
      expect(foundVerification!.status).toBe('pending_review');
      expect(foundVerification!.userId).toBe(testUser.id);

      // Assert: Should include user association (using type assertion for the test)
      const verificationWithUser = foundVerification as any;
      expect(verificationWithUser.user).toBeDefined();
    });
  });

  /**
   * Bug 1.6 - Frontend Errors with Infinite Retries Test
   * 
   * EXPECTED OUTCOME on UNFIXED code: Test FAILS - inconsistent 
   * responses or missing required fields
   * 
   * This test verifies that the status endpoint returns consistent,
   * well-formed responses in all cases.
   * 
   * **Validates: Requirements 1.6, 2.6**
   */
  describe('Bug 1.6 - Frontend Errors with Infinite Retries', () => {
    it('should return consistent response structure when no verification exists', async () => {
      // Query status for user with no verification
      const verification = await kycService.getVerificationByUserId(testUser.id);

      // Assert: Should return null (not undefined, not error)
      expect(verification).toBeNull();
    });

    it('should return consistent response structure when verification exists', async () => {
      // Create verification
      const verification = await kycService.createVerification(testUser.id);

      // Query status
      const fetchedVerification = await kycService.getVerificationByUserId(testUser.id);

      // Assert: Should return verification with all required fields
      expect(fetchedVerification).toBeDefined();
      expect(fetchedVerification).not.toBeNull();
      
      // Assert: All required fields should be present and defined
      expect(fetchedVerification!.id).toBeDefined();
      expect(fetchedVerification!.userId).toBe(testUser.id);
      expect(fetchedVerification!.status).toBeDefined();
      expect(fetchedVerification!.verificationLevel).toBeDefined();
      expect(fetchedVerification!.createdAt).toBeDefined();
      expect(fetchedVerification!.updatedAt).toBeDefined();
      
      // Assert: Fields should have correct types
      expect(typeof fetchedVerification!.id).toBe('number');
      expect(typeof fetchedVerification!.userId).toBe('number');
      expect(typeof fetchedVerification!.status).toBe('string');
      expect(typeof fetchedVerification!.verificationLevel).toBe('number');
      expect(fetchedVerification!.createdAt).toBeInstanceOf(Date);
      expect(fetchedVerification!.updatedAt).toBeInstanceOf(Date);
    });

    it('should return consistent response for verification in different states', async () => {
      // Create verification
      const verification = await kycService.createVerification(testUser.id);

      // Test different states
      const states: Array<'not_started' | 'in_progress' | 'pending_review' | 'approved'> = [
        'not_started',
        'in_progress', 
        'pending_review',
        'approved'
      ];

      for (const state of states) {
        await verification.update({ status: state });
        
        const fetchedVerification = await kycService.getVerificationByUserId(testUser.id);
        
        // Assert: Should always return consistent structure
        expect(fetchedVerification).toBeDefined();
        expect(fetchedVerification!.id).toBeDefined();
        expect(fetchedVerification!.status).toBe(state);
        expect(fetchedVerification!.verificationLevel).toBeDefined();
        expect(fetchedVerification!.createdAt).toBeDefined();
        expect(fetchedVerification!.updatedAt).toBeDefined();
      }
    });
  });
});
