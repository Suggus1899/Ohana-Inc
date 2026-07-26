import crypto from 'crypto';
import dotenv from 'dotenv';
import { auditLogger } from './audit-logger.service';

dotenv.config();

/**
 * EncryptionService
 * 
 * Servicio de encriptación AES-256-GCM para documentos sensibles del sistema KYC.
 * Implementa encriptación/desencriptación con IV único por operación y authTag para integridad.
 * 
 * Requisitos: 12.1-12.13, 34.1-34.7
 */

export interface EncryptedData {
  encrypted: Buffer;
  iv: Buffer; // 16 bytes
  authTag: Buffer; // 16 bytes
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;

    // Validar que ENCRYPTION_KEY existe
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Validar que ENCRYPTION_KEY tiene exactamente 64 caracteres hexadecimales
    if (encryptionKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes)');
    }

    // Validar que ENCRYPTION_KEY contiene solo caracteres hexadecimales válidos
    if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
      throw new Error('ENCRYPTION_KEY must contain only hexadecimal characters (0-9, a-f, A-F)');
    }

    // Convertir la clave hexadecimal a Buffer de 32 bytes
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  /**
   * Encripta datos usando AES-256-GCM
   * 
   * @param data - Buffer de datos a encriptar
   * @returns Objeto con datos encriptados, IV y authTag
   * 
   * Requisitos: 12.1, 12.2, 34.1, 34.2, 34.3
   */
  encrypt(data: Buffer): EncryptedData {
    // Generar IV aleatorio único de 16 bytes (Requisito 12.2, 34.3)
    const iv = crypto.randomBytes(this.ivLength);

    // Crear cipher con algoritmo AES-256-GCM (Requisito 12.1)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    // Encriptar datos
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);

    // Obtener authTag para verificación de integridad (Requisito 12.3)
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv,
      authTag
    };
  }

  /**
   * Desencripta datos usando AES-256-GCM
   * 
   * @param encryptedData - Objeto con datos encriptados, IV y authTag
   * @returns Buffer con datos originales desencriptados
   * @throws Error si la desencriptación falla o el authTag no coincide
   * 
   * Requisitos: 12.1, 12.11, 34.1
   */
  decrypt(encryptedData: EncryptedData): Buffer {
    const { encrypted, iv, authTag } = encryptedData;

    // Crear decipher con algoritmo AES-256-GCM
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

    // Establecer authTag para verificación de integridad
    decipher.setAuthTag(authTag);

    try {
      // Desencriptar datos
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: data may be corrupted or authTag is invalid');
    }
  }

  /**
   * Calcula hash SHA-256 de datos
   * 
   * @param data - Buffer de datos para calcular hash
   * @returns String hexadecimal del hash SHA-256 (64 caracteres)
   * 
   * Requisitos: 12.7, 4.11, 34.7
   */
  calculateHash(data: Buffer): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Verifica integridad de datos comparando con hash
   * 
   * @param data - Buffer de datos originales
   * @param hash - Hash SHA-256 esperado en formato hexadecimal
   * @returns true si el hash coincide, false en caso contrario
   * 
   * Requisitos: 12.7, 34.7
   */
  verifyIntegrity(data: Buffer, hash: string): boolean {
    const calculatedHash = this.calculateHash(data);
    return calculatedHash === hash;
  }
}
