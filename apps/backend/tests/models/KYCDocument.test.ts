import { sequelize } from '../../src/config/database';
import KYCDocument, { DocumentType } from '../../src/models/KYCDocument';
import KYCVerification from '../../src/models/KYCVerification';
import User from '../../src/models/User';

describe('KYCDocument Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Model Definition', () => {
    it('should create a KYCDocument instance with all required fields', async () => {
      // Create a user first
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        verificationLevel: 0
      });

      // Create a KYC verification
      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      // Create a KYC document
      const document = await KYCDocument.create({
        verificationId: verification.id,
        documentType: 'id_front',
        url: 'https://storage.example.com/documents/original/doc123.jpg',
        encryptedUrl: 'https://storage.example.com/documents/encrypted/doc123.enc',
        fileHash: 'a'.repeat(64), // SHA-256 hash (64 hex characters)
        metadata: {
          originalName: 'passport.jpg',
          size: 1024000,
          mimeType: 'image/jpeg'
        },
        uploadedAt: new Date()
      });

      expect(document.id).toBeDefined();
      expect(document.verificationId).toBe(verification.id);
      expect(document.documentType).toBe('id_front');
      expect(document.url).toBe('https://storage.example.com/documents/original/doc123.jpg');
      expect(document.encryptedUrl).toBe('https://storage.example.com/documents/encrypted/doc123.enc');
      expect(document.fileHash).toHaveLength(64);
      expect(document.metadata).toEqual({
        originalName: 'passport.jpg',
        size: 1024000,
        mimeType: 'image/jpeg'
      });
      expect(document.uploadedAt).toBeInstanceOf(Date);
    });

    it('should validate documentType enum values', async () => {
      const validTypes: DocumentType[] = [
        'id_front',
        'id_back',
        'selfie',
        'selfie_with_doc',
        'liveness_video',
        'proof_of_address'
      ];

      for (const type of validTypes) {
        const user = await User.create({
          email: `test-${type}@example.com`,
          password: 'hashedpassword',
          name: 'Test User',
          role: 'cliente',
          verificationLevel: 0
        });

        const verification = await KYCVerification.create({
          userId: user.id,
          status: 'in_progress',
          verificationLevel: 0,
          attempts: 0
        });

        const document = await KYCDocument.create({
          verificationId: verification.id,
          documentType: type,
          url: `https://storage.example.com/${type}.jpg`,
          encryptedUrl: `https://storage.example.com/${type}.enc`,
          fileHash: 'b'.repeat(64),
          metadata: {},
          uploadedAt: new Date()
        });

        expect(document.documentType).toBe(type);
      }
    });

    it('should have default empty object for metadata', async () => {
      const user = await User.create({
        email: 'test-metadata@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        verificationLevel: 0
      });

      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      const document = await KYCDocument.create({
        verificationId: verification.id,
        documentType: 'selfie',
        url: 'https://storage.example.com/selfie.jpg',
        encryptedUrl: 'https://storage.example.com/selfie.enc',
        fileHash: 'c'.repeat(64),
        uploadedAt: new Date()
      });

      expect(document.metadata).toEqual({});
    });
  });

  describe('Associations', () => {
    it('should belong to KYCVerification', async () => {
      const user = await User.create({
        email: 'test-assoc@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        verificationLevel: 0
      });

      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      const document = await KYCDocument.create({
        verificationId: verification.id,
        documentType: 'id_front',
        url: 'https://storage.example.com/id.jpg',
        encryptedUrl: 'https://storage.example.com/id.enc',
        fileHash: 'd'.repeat(64),
        metadata: {},
        uploadedAt: new Date()
      });

      const foundDocument = await KYCDocument.findByPk(document.id, {
        include: [{ model: KYCVerification, as: 'verification' }]
      });

      expect(foundDocument).toBeDefined();
      expect(foundDocument?.verification).toBeDefined();
      expect(foundDocument?.verification?.id).toBe(verification.id);
    });
  });

  describe('Timestamps', () => {
    it('should not have automatic timestamps (only uploadedAt)', async () => {
      const user = await User.create({
        email: 'test-timestamps@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'cliente',
        verificationLevel: 0
      });

      const verification = await KYCVerification.create({
        userId: user.id,
        status: 'in_progress',
        verificationLevel: 0,
        attempts: 0
      });

      const document = await KYCDocument.create({
        verificationId: verification.id,
        documentType: 'selfie',
        url: 'https://storage.example.com/selfie.jpg',
        encryptedUrl: 'https://storage.example.com/selfie.enc',
        fileHash: 'e'.repeat(64),
        metadata: {},
        uploadedAt: new Date()
      });

      // Check that createdAt and updatedAt are not present
      const plainDocument = document.toJSON() as any;
      expect(plainDocument.createdAt).toBeUndefined();
      expect(plainDocument.updatedAt).toBeUndefined();
      expect(plainDocument.uploadedAt).toBeDefined();
    });
  });
});
