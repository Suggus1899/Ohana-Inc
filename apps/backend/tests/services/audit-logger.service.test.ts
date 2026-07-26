import { AuditLogger, AuditEvent } from '../../src/services/audit-logger.service';
import fs from 'fs-extra';
import path from 'path';

describe('AuditLogger Service', () => {
  let auditLogger: AuditLogger;
  let testLogPath: string;

  beforeEach(() => {
    // Configurar ruta de logs de prueba
    testLogPath = path.join(__dirname, '../../logs-test');
    process.env.AUDIT_LOG_PATH = testLogPath;
    process.env.AUDIT_STORAGE_TYPE = 'file';
    
    // Crear instancia de AuditLogger
    auditLogger = new AuditLogger();
  });

  afterEach(async () => {
    // Limpiar archivos de prueba
    if (await fs.pathExists(testLogPath)) {
      await fs.remove(testLogPath);
    }
  });

  describe('logAuditEvent', () => {
    it('should create audit log file if it does not exist', async () => {
      await auditLogger.logAuditEvent('test_event', 1, {}, '127.0.0.1');
      
      const logFile = path.join(testLogPath, 'audit.log');
      const exists = await fs.pathExists(logFile);
      
      expect(exists).toBe(true);
    });

    it('should write audit event in JSON format', async () => {
      await auditLogger.logAuditEvent('verification_started', 123, { test: 'data' }, '192.168.1.1');
      
      const logFile = path.join(testLogPath, 'audit.log');
      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.trim().split('\n');
      
      expect(lines.length).toBe(1);
      
      const logEntry = JSON.parse(lines[0]);
      expect(logEntry.event).toBe('verification_started');
      expect(logEntry.userId).toBe(123);
      expect(logEntry.metadata).toEqual({ test: 'data' });
      expect(logEntry.ip).toBe('192.168.1.1');
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should append multiple events to the same file', async () => {
      await auditLogger.logAuditEvent('event1', 1, {}, '127.0.0.1');
      await auditLogger.logAuditEvent('event2', 2, {}, '127.0.0.1');
      await auditLogger.logAuditEvent('event3', 3, {}, '127.0.0.1');
      
      const logFile = path.join(testLogPath, 'audit.log');
      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.trim().split('\n');
      
      expect(lines.length).toBe(3);
    });

    it('should NOT log sensitive data in metadata (Requisito 32.13)', async () => {
      const sensitiveMetadata = {
        documentType: 'id_front',
        fileHash: 'abc123',
        imageBuffer: Buffer.from('sensitive image data'),
        password: 'secret123',
        token: 'jwt-token',
        normalField: 'this should be logged'
      };

      await auditLogger.logAuditEvent('document_uploaded', 1, sensitiveMetadata, '127.0.0.1');
      
      const logFile = path.join(testLogPath, 'audit.log');
      const content = await fs.readFile(logFile, 'utf8');
      const logEntry = JSON.parse(content.trim());
      
      // Verificar que campos sensibles NO están presentes
      expect(logEntry.metadata.imageBuffer).toBeUndefined();
      expect(logEntry.metadata.password).toBeUndefined();
      expect(logEntry.metadata.token).toBeUndefined();
      
      // Verificar que campos normales SÍ están presentes
      expect(logEntry.metadata.documentType).toBe('id_front');
      expect(logEntry.metadata.fileHash).toBe('abc123');
      expect(logEntry.metadata.normalField).toBe('this should be logged');
    });

    it('should sanitize nested sensitive data', async () => {
      const nestedMetadata = {
        user: {
          id: 123,
          name: 'John Doe',
          password: 'should-not-appear'
        },
        document: {
          type: 'id_front',
          imageData: 'base64-image-data',
          hash: 'abc123'
        }
      };

      await auditLogger.logAuditEvent('test_event', 1, nestedMetadata, '127.0.0.1');
      
      const logFile = path.join(testLogPath, 'audit.log');
      const content = await fs.readFile(logFile, 'utf8');
      const logEntry = JSON.parse(content.trim());
      
      // Verificar sanitización en objetos anidados
      expect(logEntry.metadata.user.password).toBeUndefined();
      expect(logEntry.metadata.document.imageData).toBeUndefined();
      expect(logEntry.metadata.user.name).toBe('John Doe');
      expect(logEntry.metadata.document.hash).toBe('abc123');
    });
  });

  describe('logOperatorEvent', () => {
    it('should log operator actions with operatorId', async () => {
      await auditLogger.logOperatorEvent('verification_approved', 999, 123, {}, '10.0.0.1');
      
      const logFile = path.join(testLogPath, 'audit.log');
      const content = await fs.readFile(logFile, 'utf8');
      const logEntry = JSON.parse(content.trim());
      
      expect(logEntry.event).toBe('verification_approved');
      expect(logEntry.operatorId).toBe(999);
      expect(logEntry.userId).toBe(123);
      expect(logEntry.ip).toBe('10.0.0.1');
    });
  });

  describe('queryLogs', () => {
    beforeEach(async () => {
      // Crear logs de prueba
      await auditLogger.logAuditEvent('event1', 1, { type: 'A' }, '127.0.0.1');
      await auditLogger.logAuditEvent('event2', 2, { type: 'B' }, '127.0.0.2');
      await auditLogger.logAuditEvent('event1', 1, { type: 'C' }, '127.0.0.1');
      await auditLogger.logOperatorEvent('event3', 999, 3, { type: 'D' }, '10.0.0.1');
    });

    it('should return all logs when no filters are provided', async () => {
      const logs = await auditLogger.queryLogs();
      
      expect(logs.length).toBe(4);
    });

    it('should filter logs by userId', async () => {
      const logs = await auditLogger.queryLogs({ userId: 1 });
      
      expect(logs.length).toBe(2);
      expect(logs.every(log => log.userId === 1)).toBe(true);
    });

    it('should filter logs by event type', async () => {
      const logs = await auditLogger.queryLogs({ event: 'event1' });
      
      expect(logs.length).toBe(2);
      expect(logs.every(log => log.event === 'event1')).toBe(true);
    });

    it('should filter logs by operatorId', async () => {
      const logs = await auditLogger.queryLogs({ operatorId: 999 });
      
      expect(logs.length).toBe(1);
      expect(logs[0].operatorId).toBe(999);
    });

    it('should apply limit to results', async () => {
      const logs = await auditLogger.queryLogs({ limit: 2 });
      
      expect(logs.length).toBe(2);
    });

    it('should return logs in descending order by timestamp', async () => {
      const logs = await auditLogger.queryLogs();
      
      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          logs[i + 1].timestamp.getTime()
        );
      }
    });

    it('should filter logs by date range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      const logs = await auditLogger.queryLogs({
        dateFrom: twoHoursAgo,
        dateTo: now
      });
      
      expect(logs.length).toBeGreaterThan(0);
      logs.forEach(log => {
        expect(log.timestamp.getTime()).toBeGreaterThanOrEqual(twoHoursAgo.getTime());
        expect(log.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should return empty array if log file does not exist', async () => {
      // Eliminar archivo de logs
      const logFile = path.join(testLogPath, 'audit.log');
      await fs.remove(logFile);
      
      const logs = await auditLogger.queryLogs();
      
      expect(logs).toEqual([]);
    });
  });

  describe('Convenience methods', () => {
    it('should log verification started (Requisito 32.1)', async () => {
      await auditLogger.logVerificationStarted(123, '192.168.1.1');
      
      const logs = await auditLogger.queryLogs({ event: 'verification_started' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].userId).toBe(123);
      expect(logs[0].ip).toBe('192.168.1.1');
    });

    it('should log document uploaded (Requisito 32.2)', async () => {
      await auditLogger.logDocumentUploaded(123, 'id_front', 'abc123hash', '192.168.1.1');
      
      const logs = await auditLogger.queryLogs({ event: 'document_uploaded' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].metadata?.documentType).toBe('id_front');
      expect(logs[0].metadata?.fileHash).toBe('abc123hash');
    });

    it('should log face match call (Requisito 32.3)', async () => {
      const result = { match: true, score: 87.5, distance: 0.125 };
      await auditLogger.logFaceMatchCall(123, 'compare_faces', result, '192.168.1.1');
      
      const logs = await auditLogger.queryLogs({ event: 'face_match_call' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].metadata?.operation).toBe('compare_faces');
      expect(logs[0].metadata?.result.match).toBe(true);
      expect(logs[0].metadata?.result.score).toBe(87.5);
    });

    it('should log OCR call (Requisito 32.4)', async () => {
      const result = { 
        confidence: 92, 
        documentNumber: 'V12345678',
        rawText: 'should not be logged'
      };
      await auditLogger.logOCRCall(123, result, '192.168.1.1');
      
      const logs = await auditLogger.queryLogs({ event: 'ocr_call' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].metadata?.confidence).toBe(92);
      expect(logs[0].metadata?.fieldsExtracted).toContain('documentNumber');
      // rawText no debe estar en metadata
      expect(logs[0].metadata?.rawText).toBeUndefined();
    });

    it('should log verification approved (Requisito 32.5)', async () => {
      await auditLogger.logVerificationApproved(999, 123, '10.0.0.1');
      
      const logs = await auditLogger.queryLogs({ event: 'verification_approved' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].operatorId).toBe(999);
      expect(logs[0].userId).toBe(123);
    });

    it('should log verification rejected (Requisito 32.6)', async () => {
      await auditLogger.logVerificationRejected(999, 123, 'Documento ilegible', '10.0.0.1');
      
      const logs = await auditLogger.queryLogs({ event: 'verification_rejected' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].metadata?.reason).toBe('Documento ilegible');
    });

    it('should log document access (Requisito 32.7)', async () => {
      await auditLogger.logDocumentAccess(999, 123, 'id_front', '10.0.0.1');
      
      const logs = await auditLogger.queryLogs({ event: 'document_accessed' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].metadata?.documentType).toBe('id_front');
    });

    it('should log document deletion (Requisito 32.8)', async () => {
      await auditLogger.logDocumentDeletion(123, 'GDPR erasure request', '192.168.1.1');
      
      const logs = await auditLogger.queryLogs({ event: 'document_deleted' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].metadata?.reason).toBe('GDPR erasure request');
    });

    it('should log GDPR request (Requisito 32.9)', async () => {
      await auditLogger.logGDPRRequest(123, 'erasure', '192.168.1.1');
      
      const logs = await auditLogger.queryLogs({ event: 'gdpr_request' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].metadata?.rightType).toBe('erasure');
    });
  });

  describe('Error handling', () => {
    it('should not throw error if log write fails', async () => {
      // Configurar ruta inválida
      process.env.AUDIT_LOG_PATH = '/invalid/path/that/does/not/exist';
      const invalidLogger = new AuditLogger();
      
      // No debería lanzar error
      await expect(
        invalidLogger.logAuditEvent('test_event', 1, {}, '127.0.0.1')
      ).resolves.not.toThrow();
    });
  });
});
