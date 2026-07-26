import { sequelize } from '../../src/config/database';
import KYCAttempt, { AttemptStep } from '../../src/models/KYCAttempt';
import KYCVerification from '../../src/models/KYCVerification';
import User from '../../src/models/User';

describe('KYCAttempt Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Model Definition', () => {
    it('should create a KYCAttempt instance with all required fields', async () => {
      // Create a user first
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        phonePrefix: '+58',
        phone: '4241234567',
        cedulaType: 'V',
        cedula: '12345678',
        isVerified: false
      });

      // Create a KYC verification
      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      // Create a KYC attempt
      const attempt = await KYCAttempt.create({
        verificationId: verification.id,
        attemptNumber: 1,
        step: 'document_capture',
        success: true,
        metadata: {
          duration: 5000,
          userAgent: 'Mozilla/5.0'
        }
      });

      expect(attempt.id).toBeDefined();
      expect(attempt.verificationId).toBe(verification.id);
      expect(attempt.attemptNumber).toBe(1);
      expect(attempt.step).toBe('document_capture');
      expect(attempt.success).toBe(true);
      expect(attempt.errorMessage).toBeUndefined();
      expect(attempt.metadata).toEqual({
        duration: 5000,
        userAgent: 'Mozilla/5.0'
      });
      expect(attempt.createdAt).toBeInstanceOf(Date);
    });

    it('should validate step enum values', async () => {
      const validSteps: AttemptStep[] = [
        'document_capture',
        'selfie',
        'liveness',
        'ocr',
        'face_match',
        'document_validation',
        'manual_review'
      ];

      const user = await User.create({
        email: 'test-steps@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        phonePrefix: '+58',
        phone: '4241234567',
        cedulaType: 'V',
        cedula: '12345679',
        isVerified: false
      });

      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      for (let i = 0; i < validSteps.length; i++) {
        const step = validSteps[i];
        const attempt = await KYCAttempt.create({
          verificationId: verification.id,
          attemptNumber: i + 1,
          step: step,
          success: true,
          metadata: {}
        });

        expect(attempt.step).toBe(step);
      }
    });

    it('should have default false for success field', async () => {
      const user = await User.create({
        email: 'test-default@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        phonePrefix: '+58',
        phone: '4241234567',
        cedulaType: 'V',
        cedula: '12345680',
        isVerified: false
      });

      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      const attempt = await KYCAttempt.create({
        verificationId: verification.id,
        attemptNumber: 1,
        step: 'ocr',
        metadata: {}
      });

      expect(attempt.success).toBe(false);
    });

    it('should have default empty object for metadata', async () => {
      const user = await User.create({
        email: 'test-metadata@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        phonePrefix: '+58',
        phone: '4241234567',
        cedulaType: 'V',
        cedula: '12345681',
        isVerified: false
      });

      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      const attempt = await KYCAttempt.create({
        verificationId: verification.id,
        attemptNumber: 1,
        step: 'face_match',
        success: false
      });

      expect(attempt.metadata).toEqual({});
    });

    it('should store error message when attempt fails', async () => {
      const user = await User.create({
        email: 'test-error@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        phonePrefix: '+58',
        phone: '4241234567',
        cedulaType: 'V',
        cedula: '12345682',
        isVerified: false
      });

      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      const errorMsg = 'Face detection failed: No face found in image';
      const attempt = await KYCAttempt.create({
        verificationId: verification.id,
        attemptNumber: 1,
        step: 'face_match',
        success: false,
        errorMessage: errorMsg,
        metadata: { confidence: 0.45 }
      });

      expect(attempt.success).toBe(false);
      expect(attempt.errorMessage).toBe(errorMsg);
      expect(attempt.metadata.confidence).toBe(0.45);
    });
  });

  describe('Associations', () => {
    it('should belong to KYCVerification', async () => {
      const user = await User.create({
        email: 'test-assoc@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        phonePrefix: '+58',
        phone: '4241234567',
        cedulaType: 'V',
        cedula: '12345683',
        isVerified: false
      });

      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      const attempt = await KYCAttempt.create({
        verificationId: verification.id,
        attemptNumber: 1,
        step: 'liveness',
        success: true,
        metadata: {}
      });

      const foundAttempt = await KYCAttempt.findByPk(attempt.id, {
        include: [{ model: KYCVerification, as: 'verification' }]
      });

      expect(foundAttempt).toBeDefined();
      expect(foundAttempt?.verification).toBeDefined();
      expect(foundAttempt?.verification?.id).toBe(verification.id);
    });

    it('should allow multiple attempts for same verification', async () => {
      const user = await User.create({
        email: 'test-multiple@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        phonePrefix: '+58',
        phone: '4241234567',
        cedulaType: 'V',
        cedula: '12345684',
        isVerified: false
      });

      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      const attempt1 = await KYCAttempt.create({
        verificationId: verification.id,
        attemptNumber: 1,
        step: 'document_capture',
        success: false,
        errorMessage: 'Image too dark',
        metadata: {}
      });

      const attempt2 = await KYCAttempt.create({
        verificationId: verification.id,
        attemptNumber: 2,
        step: 'document_capture',
        success: true,
        metadata: {}
      });

      const attempts = await KYCAttempt.findAll({
        where: { verificationId: verification.id }
      });

      expect(attempts).toHaveLength(2);
      expect(attempts[0].attemptNumber).toBe(1);
      expect(attempts[0].success).toBe(false);
      expect(attempts[1].attemptNumber).toBe(2);
      expect(attempts[1].success).toBe(true);
    });
  });

  describe('Timestamps', () => {
    it('should not have automatic timestamps (only createdAt)', async () => {
      const user = await User.create({
        email: 'test-timestamps@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        phonePrefix: '+58',
        phone: '4241234567',
        cedulaType: 'V',
        cedula: '12345685',
        isVerified: false
      });

      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      const attempt = await KYCAttempt.create({
        verificationId: verification.id,
        attemptNumber: 1,
        step: 'manual_review',
        success: true,
        metadata: {}
      });

      // Check that updatedAt is not present
      const plainAttempt = attempt.toJSON() as any;
      expect(plainAttempt.createdAt).toBeDefined();
      expect(plainAttempt.updatedAt).toBeUndefined();
    });
  });
});
