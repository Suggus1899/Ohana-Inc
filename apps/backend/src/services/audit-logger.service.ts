import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * AuditLogger Service
 * 
 * Servicio de registro de auditoría para el sistema KYC.
 * Registra todas las acciones críticas en formato JSON estructurado.
 * 
 * Requisitos: 32.1-32.13
 */

export interface AuditEvent {
  timestamp: Date;
  event: string;
  userId?: number;
  operatorId?: number;
  metadata?: Record<string, any>;
  ip?: string;
}

export class AuditLogger {
  private logFilePath: string;
  private storageType: 'file' | 'database';

  constructor() {
    // Determinar tipo de almacenamiento (por defecto: archivo)
    this.storageType = (process.env.AUDIT_STORAGE_TYPE as 'file' | 'database') || 'file';
    
    // Configurar ruta del archivo de logs
    const logDir = process.env.AUDIT_LOG_PATH || path.join(__dirname, '../../logs');
    this.logFilePath = path.join(logDir, 'audit.log');
    
    // Crear directorio de logs si no existe
    if (this.storageType === 'file') {
      fs.ensureDirSync(logDir);
    }
  }

  /**
   * Registra un evento de auditoría
   * 
   * @param event - Nombre del evento (ej: 'verification_started', 'document_uploaded')
   * @param userId - ID del usuario relacionado
   * @param metadata - Metadatos adicionales del evento
   * @param ip - Dirección IP del cliente (opcional)
   * 
   * Requisitos: 32.1-32.10, 32.13
   */
  async logAuditEvent(
    event: string,
    userId: number,
    metadata?: Record<string, any>,
    ip?: string
  ): Promise<void> {
    // Crear registro de auditoría (Requisito 32.10)
    const auditEntry: AuditEvent = {
      timestamp: new Date(),
      event,
      userId,
      metadata: this.sanitizeMetadata(metadata), // Requisito 32.13: NO registrar datos sensibles
      ip
    };

    // Almacenar según tipo configurado
    if (this.storageType === 'file') {
      await this.writeToFile(auditEntry);
    } else {
      // TODO: Implementar almacenamiento en base de datos si se requiere
      await this.writeToFile(auditEntry);
    }
  }

  /**
   * Registra un evento de auditoría con operador
   * 
   * @param event - Nombre del evento
   * @param operatorId - ID del operador que realiza la acción
   * @param userId - ID del usuario afectado
   * @param metadata - Metadatos adicionales
   * @param ip - Dirección IP del operador
   * 
   * Requisitos: 32.5-32.7
   */
  async logOperatorEvent(
    event: string,
    operatorId: number,
    userId: number,
    metadata?: Record<string, any>,
    ip?: string
  ): Promise<void> {
    const auditEntry: AuditEvent = {
      timestamp: new Date(),
      event,
      operatorId,
      userId,
      metadata: this.sanitizeMetadata(metadata),
      ip
    };

    if (this.storageType === 'file') {
      await this.writeToFile(auditEntry);
    } else {
      await this.writeToFile(auditEntry);
    }
  }

  /**
   * Escribe un registro de auditoría en archivo JSON
   * 
   * @private
   */
  private async writeToFile(auditEntry: AuditEvent): Promise<void> {
    try {
      // Convertir a JSON con nueva línea (Requisito 32.10)
      const logLine = JSON.stringify(auditEntry) + '\n';
      
      // Agregar al archivo de logs (append)
      await fs.appendFile(this.logFilePath, logLine, 'utf8');
    } catch (error) {
      // Log error pero no fallar la operación principal
      console.error('Error writing audit log:', error);
    }
  }

  /**
   * Sanitiza metadatos para eliminar datos sensibles
   * 
   * @private
   * @param metadata - Metadatos originales
   * @returns Metadatos sanitizados sin datos sensibles
   * 
   * Requisito 32.13: NO registrar datos sensibles
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) {
      return undefined;
    }

    // Lista de patrones sensibles que NO deben registrarse
    const sensitivePatterns = [
      /^image$/i,
      /imagedata/i,
      /imagebuffer/i,
      /^buffer$/i,
      /^file$/i,
      /filebuffer/i,
      /filedata/i,
      /^video$/i,
      /videodata/i,
      /videobuffer/i,
      /documentcontent/i,
      /rawtext/i,
      /ocrtext/i,
      /fulltext/i,
      /^password$/i,
      /^token$/i,
      /^secret$/i,
      /^key$/i,
      /^iv$/i,
      /authtag/i,
      /^encrypted$/i,
      /^decrypted$/i
    ];

    // Crear copia del objeto
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      // Verificar si el campo es sensible
      const isSensitive = sensitivePatterns.some(pattern => 
        pattern.test(key)
      );

      if (!isSensitive) {
        // Si el valor es un objeto, sanitizar recursivamente
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          sanitized[key] = this.sanitizeMetadata(value);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Consulta logs de auditoría (solo para administradores)
   * 
   * @param filters - Filtros opcionales
   * @returns Array de eventos de auditoría
   * 
   * Requisito 32.12: Endpoint protegido para consultar logs
   */
  async queryLogs(filters?: {
    userId?: number;
    operatorId?: number;
    event?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Promise<AuditEvent[]> {
    if (this.storageType === 'file') {
      return this.queryLogsFromFile(filters);
    } else {
      // TODO: Implementar consulta desde base de datos
      return this.queryLogsFromFile(filters);
    }
  }

  /**
   * Consulta logs desde archivo
   * 
   * @private
   */
  private async queryLogsFromFile(filters?: {
    userId?: number;
    operatorId?: number;
    event?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Promise<AuditEvent[]> {
    try {
      // Verificar si el archivo existe
      if (!await fs.pathExists(this.logFilePath)) {
        return [];
      }

      // Leer archivo completo
      const content = await fs.readFile(this.logFilePath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);

      // Parsear cada línea JSON
      let logs: AuditEvent[] = lines.map(line => {
        try {
          const parsed = JSON.parse(line);
          // Convertir timestamp string a Date
          parsed.timestamp = new Date(parsed.timestamp);
          return parsed;
        } catch {
          return null;
        }
      }).filter(log => log !== null) as AuditEvent[];

      // Aplicar filtros
      if (filters) {
        if (filters.userId !== undefined) {
          logs = logs.filter(log => log.userId === filters.userId);
        }
        if (filters.operatorId !== undefined) {
          logs = logs.filter(log => log.operatorId === filters.operatorId);
        }
        if (filters.event) {
          logs = logs.filter(log => log.event === filters.event);
        }
        if (filters.dateFrom) {
          logs = logs.filter(log => log.timestamp >= filters.dateFrom!);
        }
        if (filters.dateTo) {
          logs = logs.filter(log => log.timestamp <= filters.dateTo!);
        }
      }

      // Ordenar por timestamp descendente (más recientes primero)
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Aplicar límite
      if (filters?.limit) {
        logs = logs.slice(0, filters.limit);
      }

      return logs;
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }
  }

  /**
   * Métodos de conveniencia para eventos específicos
   */

  // Requisito 32.1: Inicio de proceso de verificación
  async logVerificationStarted(userId: number, ip?: string): Promise<void> {
    await this.logAuditEvent('verification_started', userId, {}, ip);
  }

  // Requisito 32.2: Carga de documento
  async logDocumentUploaded(
    userId: number,
    documentType: string,
    fileHash: string,
    ip?: string
  ): Promise<void> {
    await this.logAuditEvent('document_uploaded', userId, {
      documentType,
      fileHash
    }, ip);
  }

  // Requisito 32.3: Llamada a servicio de reconocimiento facial
  async logFaceMatchCall(
    userId: number,
    operation: string,
    result: any,
    ip?: string
  ): Promise<void> {
    await this.logAuditEvent('face_match_call', userId, {
      operation,
      result: {
        match: result.match,
        score: result.score
        // NO incluir imágenes o descriptores (Requisito 32.13)
      }
    }, ip);
  }

  // Requisito 32.4: Llamada a Tesseract OCR
  async logOCRCall(
    userId: number,
    result: any,
    ip?: string
  ): Promise<void> {
    await this.logAuditEvent('ocr_call', userId, {
      confidence: result.confidence,
      fieldsExtracted: Object.keys(result).filter(k => k !== 'rawText')
      // NO incluir rawText completo (Requisito 32.13)
    }, ip);
  }

  // Requisito 32.5: Aprobación de verificación
  async logVerificationApproved(
    operatorId: number,
    userId: number,
    ip?: string
  ): Promise<void> {
    await this.logOperatorEvent('verification_approved', operatorId, userId, {}, ip);
  }

  // Requisito 32.6: Rechazo de verificación
  async logVerificationRejected(
    operatorId: number,
    userId: number,
    reason: string,
    ip?: string
  ): Promise<void> {
    await this.logOperatorEvent('verification_rejected', operatorId, userId, {
      reason
    }, ip);
  }

  // Requisito 32.7: Acceso a documentos encriptados
  async logDocumentAccess(
    operatorId: number,
    userId: number,
    documentType: string,
    ip?: string
  ): Promise<void> {
    await this.logOperatorEvent('document_accessed', operatorId, userId, {
      documentType
    }, ip);
  }

  // Requisito 32.8: Eliminación de documentos
  async logDocumentDeletion(
    userId: number,
    reason: string,
    ip?: string
  ): Promise<void> {
    await this.logAuditEvent('document_deleted', userId, {
      reason
    }, ip);
  }

  // Requisito 32.9: Solicitud de derecho GDPR
  async logGDPRRequest(
    userId: number,
    rightType: 'access' | 'rectification' | 'erasure' | 'portability',
    ip?: string
  ): Promise<void> {
    await this.logAuditEvent('gdpr_request', userId, {
      rightType
    }, ip);
  }

  // Requisito 4.5, 10.1, 10.3, 10.4, 10.5: Análisis de liveness
  async logLivenessAnalysis(
    userId: number,
    result: {
      isLive: boolean;
      blinkCount: number;
      headMovementRange: number;
      qualityScore: number;
      failureReason?: string;
    },
    ip?: string
  ): Promise<void> {
    await this.logAuditEvent('liveness_analysis', userId, {
      isLive: result.isLive,
      blinkCount: result.blinkCount,
      headMovementRange: result.headMovementRange,
      qualityScore: result.qualityScore,
      failureReason: result.failureReason
    }, ip);
  }

  // Requisito 10.3: Evento de seguridad cuando se detecta ataque de presentación
  async logSecurityAlert(
    userId: number,
    alertType: string,
    details: {
      reason?: string;
      blinkCount?: number;
      headMovementRange?: number;
      qualityScore?: number;
    },
    ip?: string
  ): Promise<void> {
    await this.logAuditEvent('security_alert', userId, {
      alertType,
      ...details
    }, ip);
  }
}

// Exportar instancia singleton
export const auditLogger = new AuditLogger();
