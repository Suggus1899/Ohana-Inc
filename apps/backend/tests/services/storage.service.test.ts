import { StorageService, StorageMetadata } from '../../src/services/storage.service';
import * as fs from 'fs-extra';
import * as path from 'path';
import crypto from 'crypto';

describe('StorageService', () => {
  let service: StorageService;
  const testStoragePath = './test-storage';

  beforeAll(() => {
    // Set test storage path
    process.env.STORAGE_TYPE = 'local';
    process.env.STORAGE_PATH = testStoragePath;
  });

  beforeEach(() => {
    service = new StorageService();
  });

  afterEach(async () => {
    // Clean up test storage directory
    if (await fs.pathExists(testStoragePath)) {
      await fs.remove(testStoragePath);
    }
  });

  afterAll(async () => {
    // Final cleanup
    if (await fs.pathExists(testStoragePath)) {
      await fs.remove(testStoragePath);
    }
  });

  describe('Constructor', () => {
    it('should use default storage type "local" if not set', () => {
      const originalType = process.env.STORAGE_TYPE;
      delete process.env.STORAGE_TYPE;

      const newService = new StorageService();
      expect(newService.getStorageType()).toBe('local');

      process.env.STORAGE_TYPE = originalType;
    });

    it('should use default storage path if not set', async () => {
      const originalPath = process.env.STORAGE_PATH;
      delete process.env.STORAGE_PATH;

      const newService = new StorageService();
      const testData = Buffer.from('test');
      const savedPath = await newService.save('test.txt', testData);

      // Normalize path for cross-platform compatibility
      const normalizedPath = savedPath.replace(/\\/g, '/');
      expect(normalizedPath).toContain('storage/kyc');

      // Cleanup
      await fs.remove('./storage');
      process.env.STORAGE_PATH = originalPath;
    });

    it('should use configured storage type', () => {
      expect(service.getStorageType()).toBe('local');
    });
  });

  describe('save', () => {
    it('should save file to local filesystem', async () => {
      const data = Buffer.from('test file content');
      const filePath = 'documents/test.txt';

      const savedPath = await service.save(filePath, data);

      // Normalize path for cross-platform compatibility
      const normalizedPath = savedPath.replace(/\\/g, '/');
      expect(normalizedPath).toContain('test-storage');
      expect(normalizedPath).toContain('test.txt');
      expect(await fs.pathExists(savedPath)).toBe(true);
    });

    it('should create directories automatically if they do not exist', async () => {
      const data = Buffer.from('nested file');
      const filePath = 'level1/level2/level3/nested.txt';

      const savedPath = await service.save(filePath, data);

      expect(await fs.pathExists(savedPath)).toBe(true);
      const content = await fs.readFile(savedPath);
      expect(content.toString()).toBe('nested file');
    });

    it('should save file with metadata', async () => {
      const data = Buffer.from('file with metadata');
      const filePath = 'documents/with-meta.txt';
      const metadata: StorageMetadata = {
        contentType: 'text/plain',
        originalName: 'original.txt',
        size: data.length,
        iv: 'test-iv',
        authTag: 'test-auth-tag'
      };

      const savedPath = await service.save(filePath, data, metadata);

      // Check file exists
      expect(await fs.pathExists(savedPath)).toBe(true);

      // Check metadata file exists
      const metaPath = `${savedPath}.meta`;
      expect(await fs.pathExists(metaPath)).toBe(true);

      // Verify metadata content
      const savedMetadata = await fs.readJSON(metaPath);
      expect(savedMetadata).toEqual(metadata);
    });

    it('should handle empty buffer', async () => {
      const data = Buffer.from('');
      const filePath = 'empty.txt';

      const savedPath = await service.save(filePath, data);

      expect(await fs.pathExists(savedPath)).toBe(true);
      const content = await fs.readFile(savedPath);
      expect(content.length).toBe(0);
    });

    it('should handle large files', async () => {
      const data = Buffer.alloc(1024 * 1024); // 1MB
      crypto.randomFillSync(data);
      const filePath = 'large-file.bin';

      const savedPath = await service.save(filePath, data);

      expect(await fs.pathExists(savedPath)).toBe(true);
      const content = await fs.readFile(savedPath);
      expect(content.length).toBe(1024 * 1024);
    });

    it('should overwrite existing file', async () => {
      const filePath = 'overwrite.txt';
      const data1 = Buffer.from('first content');
      const data2 = Buffer.from('second content');

      await service.save(filePath, data1);
      const savedPath = await service.save(filePath, data2);

      const content = await fs.readFile(savedPath);
      expect(content.toString()).toBe('second content');
    });

    it('should handle special characters in filename', async () => {
      const data = Buffer.from('special chars');
      const filePath = 'documents/file-with-special_chars.123.txt';

      const savedPath = await service.save(filePath, data);

      expect(await fs.pathExists(savedPath)).toBe(true);
    });
  });

  describe('get', () => {
    it('should read file from local filesystem', async () => {
      const originalData = Buffer.from('test content');
      const filePath = 'documents/read-test.txt';

      await service.save(filePath, originalData);
      const retrievedData = await service.get(filePath);

      expect(retrievedData.toString()).toBe(originalData.toString());
    });

    it('should throw error if file does not exist', async () => {
      const filePath = 'non-existent.txt';

      await expect(service.get(filePath)).rejects.toThrow();
    });

    it('should handle empty file', async () => {
      const filePath = 'empty.txt';
      await service.save(filePath, Buffer.from(''));

      const data = await service.get(filePath);

      expect(data.length).toBe(0);
    });

    it('should handle large files', async () => {
      const originalData = Buffer.alloc(1024 * 1024); // 1MB
      crypto.randomFillSync(originalData);
      const filePath = 'large-read.bin';

      await service.save(filePath, originalData);
      const retrievedData = await service.get(filePath);

      expect(retrievedData.toString('hex')).toBe(originalData.toString('hex'));
    });

    it('should handle binary data correctly', async () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
      const filePath = 'binary.bin';

      await service.save(filePath, binaryData);
      const retrievedData = await service.get(filePath);

      expect(retrievedData).toEqual(binaryData);
    });
  });

  describe('delete', () => {
    it('should delete file from local filesystem', async () => {
      const data = Buffer.from('to be deleted');
      const filePath = 'documents/delete-test.txt';

      const savedPath = await service.save(filePath, data);
      expect(await fs.pathExists(savedPath)).toBe(true);

      await service.delete(filePath);

      expect(await fs.pathExists(savedPath)).toBe(false);
    });

    it('should delete metadata file if it exists', async () => {
      const data = Buffer.from('with metadata');
      const filePath = 'documents/delete-with-meta.txt';
      const metadata: StorageMetadata = {
        contentType: 'text/plain',
        originalName: 'original.txt'
      };

      const savedPath = await service.save(filePath, data, metadata);
      const metaPath = `${savedPath}.meta`;

      expect(await fs.pathExists(savedPath)).toBe(true);
      expect(await fs.pathExists(metaPath)).toBe(true);

      await service.delete(filePath);

      expect(await fs.pathExists(savedPath)).toBe(false);
      expect(await fs.pathExists(metaPath)).toBe(false);
    });

    it('should not throw error if file does not exist', async () => {
      const filePath = 'non-existent.txt';

      await expect(service.delete(filePath)).resolves.not.toThrow();
    });

    it('should not throw error if metadata file does not exist', async () => {
      const data = Buffer.from('no metadata');
      const filePath = 'documents/no-meta.txt';

      await service.save(filePath, data);
      await expect(service.delete(filePath)).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true if file exists', async () => {
      const data = Buffer.from('exists test');
      const filePath = 'documents/exists.txt';

      await service.save(filePath, data);
      const exists = await service.exists(filePath);

      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const filePath = 'non-existent.txt';

      const exists = await service.exists(filePath);

      expect(exists).toBe(false);
    });

    it('should return false for deleted file', async () => {
      const data = Buffer.from('to be deleted');
      const filePath = 'documents/deleted.txt';

      await service.save(filePath, data);
      await service.delete(filePath);
      const exists = await service.exists(filePath);

      expect(exists).toBe(false);
    });

    it('should return true for empty file', async () => {
      const filePath = 'empty.txt';
      await service.save(filePath, Buffer.from(''));

      const exists = await service.exists(filePath);

      expect(exists).toBe(true);
    });
  });

  describe('getStorageType', () => {
    it('should return configured storage type', () => {
      expect(service.getStorageType()).toBe('local');
    });

    it('should return "local" as default', () => {
      const originalType = process.env.STORAGE_TYPE;
      delete process.env.STORAGE_TYPE;

      const newService = new StorageService();
      expect(newService.getStorageType()).toBe('local');

      process.env.STORAGE_TYPE = originalType;
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete save-get-delete cycle', async () => {
      const originalData = Buffer.from('integration test data');
      const filePath = 'integration/test.txt';

      // Save
      const savedPath = await service.save(filePath, originalData);
      expect(await service.exists(filePath)).toBe(true);

      // Get
      const retrievedData = await service.get(filePath);
      expect(retrievedData.toString()).toBe(originalData.toString());

      // Delete
      await service.delete(filePath);
      expect(await service.exists(filePath)).toBe(false);
    });

    it('should handle multiple files in same directory', async () => {
      const files = [
        { path: 'multi/file1.txt', data: Buffer.from('content 1') },
        { path: 'multi/file2.txt', data: Buffer.from('content 2') },
        { path: 'multi/file3.txt', data: Buffer.from('content 3') }
      ];

      // Save all files
      for (const file of files) {
        await service.save(file.path, file.data);
      }

      // Verify all exist
      for (const file of files) {
        expect(await service.exists(file.path)).toBe(true);
        const data = await service.get(file.path);
        expect(data.toString()).toBe(file.data.toString());
      }

      // Delete all
      for (const file of files) {
        await service.delete(file.path);
        expect(await service.exists(file.path)).toBe(false);
      }
    });

    it('should handle deeply nested directory structure', async () => {
      const data = Buffer.from('deeply nested');
      const filePath = 'a/b/c/d/e/f/g/deep.txt';

      await service.save(filePath, data);
      expect(await service.exists(filePath)).toBe(true);

      const retrieved = await service.get(filePath);
      expect(retrieved.toString()).toBe('deeply nested');

      await service.delete(filePath);
      expect(await service.exists(filePath)).toBe(false);
    });

    it('should preserve binary data integrity through save-get cycle', async () => {
      const binaryData = Buffer.alloc(256);
      for (let i = 0; i < 256; i++) {
        binaryData[i] = i;
      }
      const filePath = 'binary-integrity.bin';

      await service.save(filePath, binaryData);
      const retrieved = await service.get(filePath);

      expect(retrieved).toEqual(binaryData);
      for (let i = 0; i < 256; i++) {
        expect(retrieved[i]).toBe(i);
      }
    });

    it('should handle concurrent operations', async () => {
      const operations = [];

      for (let i = 0; i < 10; i++) {
        const data = Buffer.from(`concurrent ${i}`);
        const filePath = `concurrent/file${i}.txt`;
        operations.push(service.save(filePath, data));
      }

      await Promise.all(operations);

      // Verify all files exist
      for (let i = 0; i < 10; i++) {
        const filePath = `concurrent/file${i}.txt`;
        expect(await service.exists(filePath)).toBe(true);
        const data = await service.get(filePath);
        expect(data.toString()).toBe(`concurrent ${i}`);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported storage type', async () => {
      const originalType = process.env.STORAGE_TYPE;
      process.env.STORAGE_TYPE = 's3';

      const s3Service = new StorageService();
      const data = Buffer.from('test');

      await expect(s3Service.save('test.txt', data)).rejects.toThrow('Storage type s3 not implemented yet');
      await expect(s3Service.get('test.txt')).rejects.toThrow('Storage type s3 not implemented yet');
      await expect(s3Service.delete('test.txt')).rejects.toThrow('Storage type s3 not implemented yet');

      process.env.STORAGE_TYPE = originalType;
    });
  });
});
