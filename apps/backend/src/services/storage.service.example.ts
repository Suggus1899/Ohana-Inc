/**
 * StorageService Usage Examples
 * 
 * This file demonstrates how to use the StorageService for storing
 * encrypted KYC documents in the local filesystem.
 */

import { StorageService, StorageMetadata } from './storage.service';

// Example 1: Basic file save and retrieve
async function basicExample() {
  const storage = new StorageService();
  
  // Save a file
  const fileData = Buffer.from('Document content');
  const filePath = 'kyc/user-123/id-front.jpg';
  const savedPath = await storage.save(filePath, fileData);
  console.log('File saved to:', savedPath);
  
  // Retrieve the file
  const retrievedData = await storage.get(filePath);
  console.log('File retrieved, size:', retrievedData.length);
  
  // Check if file exists
  const exists = await storage.exists(filePath);
  console.log('File exists:', exists);
  
  // Delete the file
  await storage.delete(filePath);
  console.log('File deleted');
}

// Example 2: Save file with metadata
async function metadataExample() {
  const storage = new StorageService();
  
  const fileData = Buffer.from('Encrypted document data');
  const filePath = 'kyc/user-456/selfie.jpg';
  
  // Save with encryption metadata
  const metadata: StorageMetadata = {
    contentType: 'image/jpeg',
    originalName: 'selfie.jpg',
    size: fileData.length,
    iv: 'a1b2c3d4e5f6g7h8',
    authTag: 'REDACTED'
  };
  
  const savedPath = await storage.save(filePath, fileData, metadata);
  console.log('File with metadata saved to:', savedPath);
  
  // Metadata is stored in a separate .meta file
  // It can be retrieved separately if needed
}

// Example 3: Handling multiple documents for a verification
async function multipleDocumentsExample() {
  const storage = new StorageService();
  const verificationId = 789;
  
  const documents = [
    { type: 'id_front', data: Buffer.from('Front ID image') },
    { type: 'id_back', data: Buffer.from('Back ID image') },
    { type: 'selfie', data: Buffer.from('Selfie image') },
    { type: 'liveness_video', data: Buffer.from('Video data') }
  ];
  
  // Save all documents
  for (const doc of documents) {
    const filePath = `kyc/verification-${verificationId}/${doc.type}.bin`;
    await storage.save(filePath, doc.data);
    console.log(`Saved ${doc.type}`);
  }
  
  // Verify all documents exist
  for (const doc of documents) {
    const filePath = `kyc/verification-${verificationId}/${doc.type}.bin`;
    const exists = await storage.exists(filePath);
    console.log(`${doc.type} exists:`, exists);
  }
}

// Example 4: Error handling
async function errorHandlingExample() {
  const storage = new StorageService();
  
  try {
    // Try to read non-existent file
    await storage.get('non-existent.txt');
  } catch (error) {
    console.error('File not found:', error);
  }
  
  // Safe delete (won't throw if file doesn't exist)
  await storage.delete('non-existent.txt');
  console.log('Delete completed without error');
  
  // Check existence before operations
  const filePath = 'kyc/user-999/document.jpg';
  if (await storage.exists(filePath)) {
    const data = await storage.get(filePath);
    console.log('File found and retrieved');
  } else {
    console.log('File does not exist');
  }
}

// Example 5: Integration with EncryptionService
async function encryptionIntegrationExample() {
  const storage = new StorageService();
  // Note: EncryptionService would be imported separately
  // import { EncryptionService } from './encryption.service';
  
  // Simulated encrypted data
  const originalData = Buffer.from('Sensitive document');
  const encrypted = {
    encrypted: Buffer.from('encrypted-data'),
    iv: Buffer.from('initialization-vector'),
    authTag: Buffer.from('auth-tag')
  };
  
  // Save encrypted file with metadata
  const filePath = 'kyc/user-111/encrypted-doc.bin';
  const metadata: StorageMetadata = {
    contentType: 'application/octet-stream',
    originalName: 'document.pdf',
    size: encrypted.encrypted.length,
    iv: encrypted.iv.toString('hex'),
    authTag: encrypted.authTag.toString('hex')
  };
  
  await storage.save(filePath, encrypted.encrypted, metadata);
  console.log('Encrypted file saved with metadata');
  
  // Later, retrieve and decrypt
  const encryptedData = await storage.get(filePath);
  // Metadata would be read from .meta file to get IV and authTag
  // Then use EncryptionService to decrypt
  console.log('Encrypted file retrieved for decryption');
}

// Export examples for documentation
export {
  basicExample,
  metadataExample,
  multipleDocumentsExample,
  errorHandlingExample,
  encryptionIntegrationExample
};
