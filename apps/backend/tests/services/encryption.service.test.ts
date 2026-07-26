import { EncryptionService } from '../../src/services/encryption.service';
import crypto from 'crypto';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeAll(() => {
    // Set valid ENCRYPTION_KEY for tests
    process.env.ENCRYPTION_KEY = 'REDACTED';
  });

  beforeEach(() => {
    service = new EncryptionService();
  });

  describe('Constructor Validation', () => {
    it('should throw error if ENCRYPTION_KEY is not set', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => new EncryptionService()).toThrow('ENCRYPTION_KEY environment variable is not set');

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error if ENCRYPTION_KEY is not 64 characters', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'REDACTED'; // Only 16 characters

      expect(() => new EncryptionService()).toThrow('ENCRYPTION_KEY must be exactly 64 hexadecimal characters');

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error if ENCRYPTION_KEY contains non-hex characters', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'REDACTED'; // Contains G-V

      expect(() => new EncryptionService()).toThrow('ENCRYPTION_KEY must contain only hexadecimal characters');

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should accept valid 64-character hex ENCRYPTION_KEY', () => {
      expect(() => new EncryptionService()).not.toThrow();
    });
  });

  describe('encrypt', () => {
    it('should encrypt data and return encrypted, iv, and authTag', () => {
      const data = Buffer.from('sensitive data');
      const result = service.encrypt(data);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('authTag');
      expect(result.encrypted).toBeInstanceOf(Buffer);
      expect(result.iv).toBeInstanceOf(Buffer);
      expect(result.authTag).toBeInstanceOf(Buffer);
    });

    it('should generate 16-byte IV', () => {
      const data = Buffer.from('test data');
      const result = service.encrypt(data);

      expect(result.iv.length).toBe(16);
    });

    it('should generate 16-byte authTag', () => {
      const data = Buffer.from('test data');
      const result = service.encrypt(data);

      expect(result.authTag.length).toBe(16);
    });

    it('should produce different encrypted output than original data', () => {
      const data = Buffer.from('test data');
      const result = service.encrypt(data);

      expect(result.encrypted.toString('hex')).not.toBe(data.toString('hex'));
    });

    it('should produce different encrypted output with different IVs', () => {
      const data = Buffer.from('test data');
      const result1 = service.encrypt(data);
      const result2 = service.encrypt(data);

      // IVs should be different
      expect(result1.iv.toString('hex')).not.toBe(result2.iv.toString('hex'));
      // Encrypted data should be different
      expect(result1.encrypted.toString('hex')).not.toBe(result2.encrypted.toString('hex'));
    });

    it('should handle empty buffer', () => {
      const data = Buffer.from('');
      const result = service.encrypt(data);

      expect(result.encrypted).toBeInstanceOf(Buffer);
      expect(result.iv).toBeInstanceOf(Buffer);
      expect(result.authTag).toBeInstanceOf(Buffer);
    });

    it('should handle large data', () => {
      const data = Buffer.alloc(1024 * 1024); // 1MB
      crypto.randomFillSync(data);
      const result = service.encrypt(data);

      expect(result.encrypted.length).toBeGreaterThan(0);
      expect(result.iv.length).toBe(16);
      expect(result.authTag.length).toBe(16);
    });
  });

  describe('decrypt', () => {
    it('should decrypt data back to original', () => {
      const originalData = Buffer.from('sensitive data');
      const encrypted = service.encrypt(originalData);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted.toString()).toBe(originalData.toString());
    });

    it('should handle empty buffer round-trip', () => {
      const originalData = Buffer.from('');
      const encrypted = service.encrypt(originalData);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted.toString()).toBe(originalData.toString());
    });

    it('should handle large data round-trip', () => {
      const originalData = Buffer.alloc(1024 * 1024); // 1MB
      crypto.randomFillSync(originalData);
      const encrypted = service.encrypt(originalData);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted.toString('hex')).toBe(originalData.toString('hex'));
    });

    it('should throw error if authTag is invalid', () => {
      const data = Buffer.from('test data');
      const encrypted = service.encrypt(data);

      // Tamper with authTag
      encrypted.authTag = Buffer.alloc(16);

      expect(() => service.decrypt(encrypted)).toThrow('Decryption failed');
    });

    it('should throw error if encrypted data is corrupted', () => {
      const data = Buffer.from('test data');
      const encrypted = service.encrypt(data);

      // Tamper with encrypted data
      encrypted.encrypted[0] = encrypted.encrypted[0] ^ 0xFF;

      expect(() => service.decrypt(encrypted)).toThrow('Decryption failed');
    });

    it('should throw error if IV is wrong', () => {
      const data = Buffer.from('test data');
      const encrypted = service.encrypt(data);

      // Use wrong IV
      encrypted.iv = crypto.randomBytes(16);

      expect(() => service.decrypt(encrypted)).toThrow('Decryption failed');
    });
  });

  describe('calculateHash', () => {
    it('should calculate SHA-256 hash', () => {
      const data = Buffer.from('test data');
      const hash = service.calculateHash(data);

      expect(hash).toBe('916f0027a575074ce72a331777c3478d6513f786a591bd892da1a577bf2335f9');
    });

    it('should return 64-character hex string', () => {
      const data = Buffer.from('test data');
      const hash = service.calculateHash(data);

      expect(hash.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('should produce same hash for same data (idempotent)', () => {
      const data = Buffer.from('test data');
      const hash1 = service.calculateHash(data);
      const hash2 = service.calculateHash(data);
      const hash3 = service.calculateHash(data);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    it('should produce different hash for different data', () => {
      const data1 = Buffer.from('test data 1');
      const data2 = Buffer.from('test data 2');
      const hash1 = service.calculateHash(data1);
      const hash2 = service.calculateHash(data2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty buffer', () => {
      const data = Buffer.from('');
      const hash = service.calculateHash(data);

      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should handle large data', () => {
      const data = Buffer.alloc(1024 * 1024); // 1MB
      crypto.randomFillSync(data);
      const hash = service.calculateHash(data);

      expect(hash.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });
  });

  describe('verifyIntegrity', () => {
    it('should return true for matching hash', () => {
      const data = Buffer.from('test data');
      const hash = service.calculateHash(data);
      const isValid = service.verifyIntegrity(data, hash);

      expect(isValid).toBe(true);
    });

    it('should return false for non-matching hash', () => {
      const data = Buffer.from('test data');
      const wrongHash = '0000000000000000000000000000000000000000000000000000000000000000';
      const isValid = service.verifyIntegrity(data, wrongHash);

      expect(isValid).toBe(false);
    });

    it('should return false if data is modified', () => {
      const data = Buffer.from('test data');
      const hash = service.calculateHash(data);
      const modifiedData = Buffer.from('modified data');
      const isValid = service.verifyIntegrity(modifiedData, hash);

      expect(isValid).toBe(false);
    });

    it('should handle empty buffer', () => {
      const data = Buffer.from('');
      const hash = service.calculateHash(data);
      const isValid = service.verifyIntegrity(data, hash);

      expect(isValid).toBe(true);
    });

    it('should be case-sensitive for hash comparison', () => {
      const data = Buffer.from('test data');
      const hash = service.calculateHash(data);
      const upperHash = hash.toUpperCase();
      const isValid = service.verifyIntegrity(data, upperHash);

      expect(isValid).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should encrypt, calculate hash, decrypt, and verify integrity', () => {
      const originalData = Buffer.from('sensitive document data');
      
      // Calculate hash of original
      const originalHash = service.calculateHash(originalData);
      
      // Encrypt
      const encrypted = service.encrypt(originalData);
      
      // Decrypt
      const decrypted = service.decrypt(encrypted);
      
      // Verify integrity
      const isValid = service.verifyIntegrity(decrypted, originalHash);
      
      expect(decrypted.toString()).toBe(originalData.toString());
      expect(isValid).toBe(true);
    });

    it('should handle multiple encrypt/decrypt cycles', () => {
      const originalData = Buffer.from('original data');
      let data: Buffer = originalData;
      
      for (let i = 0; i < 5; i++) {
        const encrypted = service.encrypt(data);
        data = service.decrypt(encrypted);
      }
      
      expect(data.toString()).toBe('original data');
    });
  });
});
