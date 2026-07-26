import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Metadata opcional para archivos almacenados
 */
export interface StorageMetadata {
  contentType?: string;
  originalName?: string;
  size?: number;
  iv?: string;
  authTag?: string;
}

/**
 * Configuración del servicio de almacenamiento
 */
interface StorageConfig {
  type: 'local' | 'minio' | 's3';
  localPath: string;
}

/**
 * Servicio de almacenamiento con soporte para local filesystem
 * 
 * Este servicio proporciona operaciones de almacenamiento de archivos
 * con soporte inicial para sistema de archivos local.
 * 
 * Requisitos: 12.4, 12.13, 37.1-37.3
 */
export class StorageService {
  private config: StorageConfig;

  constructor() {
    this.config = {
      type: (process.env.STORAGE_TYPE as any) || 'local',
      localPath: process.env.STORAGE_PATH || './storage/kyc'
    };
  }

  /**
   * Guarda un archivo en el almacenamiento
   * 
   * @param filePath - Ruta relativa del archivo
   * @param data - Datos del archivo como Buffer
   * @param metadata - Metadatos opcionales del archivo
   * @returns Ruta completa del archivo guardado
   */
  async save(filePath: string, data: Buffer, metadata?: StorageMetadata): Promise<string> {
    if (this.config.type === 'local') {
      return this.saveLocal(filePath, data, metadata);
    }
    throw new Error(`Storage type ${this.config.type} not implemented yet`);
  }

  /**
   * Lee un archivo del almacenamiento
   * 
   * @param filePath - Ruta del archivo a leer
   * @returns Contenido del archivo como Buffer
   */
  async get(filePath: string): Promise<Buffer> {
    if (this.config.type === 'local') {
      return this.getLocal(filePath);
    }
    throw new Error(`Storage type ${this.config.type} not implemented yet`);
  }

  /**
   * Elimina un archivo del almacenamiento
   * 
   * @param filePath - Ruta del archivo a eliminar
   */
  async delete(filePath: string): Promise<void> {
    if (this.config.type === 'local') {
      await this.deleteLocal(filePath);
      return;
    }
    throw new Error(`Storage type ${this.config.type} not implemented yet`);
  }

  /**
   * Verifica si un archivo existe en el almacenamiento
   * 
   * @param filePath - Ruta del archivo a verificar
   * @returns true si el archivo existe, false en caso contrario
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      if (this.config.type === 'local') {
        const fullPath = path.join(this.config.localPath, filePath);
        return await fs.pathExists(fullPath);
      }
      throw new Error(`Storage type ${this.config.type} not implemented yet`);
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el tipo de almacenamiento configurado
   * 
   * @returns Tipo de almacenamiento: 'local', 'minio' o 's3'
   */
  getStorageType(): 'local' | 'minio' | 's3' {
    return this.config.type;
  }

  /**
   * Guarda un archivo en el sistema de archivos local
   * Crea directorios automáticamente si no existen
   * 
   * @private
   */
  private async saveLocal(filePath: string, data: Buffer, metadata?: StorageMetadata): Promise<string> {
    // Normalize path to remove any duplicate segments (e.g., 'storage/kyc/storage/kyc/' -> 'storage/kyc/')
    // Remove any leading 'storage/kyc/' prefix from filePath to ensure it's always relative
    let normalizedFilePath = filePath.replace(/^(\.\/)?storage\/kyc\//, '');
    
    const fullPath = path.join(this.config.localPath, normalizedFilePath);
    
    // Crear directorios automáticamente si no existen
    await fs.ensureDir(path.dirname(fullPath));
    
    // Escribir archivo
    await fs.writeFile(fullPath, data);

    // Guardar metadatos si se proporcionan
    if (metadata) {
      const metaPath = `${fullPath}.meta`;
      await fs.writeJSON(metaPath, metadata);
    }

    // Return only the relative filename, not the full path
    return normalizedFilePath;
  }

  /**
   * Lee un archivo del sistema de archivos local
   * 
   * @private
   */
  private async getLocal(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.config.localPath, filePath);
    return await fs.readFile(fullPath);
  }

  /**
   * Elimina un archivo del sistema de archivos local
   * También elimina el archivo de metadatos asociado si existe
   * 
   * @private
   */
  private async deleteLocal(filePath: string): Promise<void> {
    const fullPath = path.join(this.config.localPath, filePath);
    await fs.remove(fullPath);
    
    // Eliminar archivo de metadatos si existe
    const metaPath = `${fullPath}.meta`;
    if (await fs.pathExists(metaPath)) {
      await fs.remove(metaPath);
    }
  }
}
