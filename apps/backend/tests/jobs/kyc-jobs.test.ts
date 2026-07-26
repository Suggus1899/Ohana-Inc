/**
 * Tests for KYC Scheduled Jobs
 * 
 * These tests verify that the scheduled job functions are properly configured
 * and that the business logic works correctly.
 */

// Mock de los modelos y servicios ANTES de importar
jest.mock('../../src/models/KYCVerification');
jest.mock('../../src/models/KYCDocument');
jest.mock('../../src/services/notification.service');
jest.mock('../../src/services/storage.service');
jest.mock('../../src/services/kyc.service');
jest.mock('../../src/services/face-match.service');
jest.mock('../../src/services/liveness-detection.service');
jest.mock('../../src/services/ocr.service');
jest.mock('../../src/services/alert.service');

import { deleteOldDocuments, sendExpirationReminders, checkAndSendAlerts } from '../../src/jobs/kyc-jobs';
import KYCVerification from '../../src/models/KYCVerification';
import KYCDocument from '../../src/models/KYCDocument';
import { NotificationService } from '../../src/services/notification.service';
import { StorageService } from '../../src/services/storage.service';
import { KYCService } from '../../src/services/kyc.service';
import alertService from '../../src/services/alert.service';

describe('KYC Scheduled Jobs', () => {
  describe('Job Configuration', () => {
    it('should have correct cron schedule for expired verifications check', () => {
      const fs = require('fs');
      const path = require('path');
      const jobsFilePath = path.join(__dirname, '../../src/jobs/kyc-jobs.ts');
      const content = fs.readFileSync(jobsFilePath, 'utf-8');
      
      // Verify the cron schedule is set to run daily at 2:00 AM
      expect(content).toContain("cron.schedule('0 2 * * *'");
      expect(content).toContain('checkExpiredVerifications()');
    });

    it('should have correct cron schedule for old documents deletion', () => {
      const fs = require('fs');
      const path = require('path');
      const jobsFilePath = path.join(__dirname, '../../src/jobs/kyc-jobs.ts');
      const content = fs.readFileSync(jobsFilePath, 'utf-8');
      
      // Verify the cron schedule is set to run daily at 3:00 AM
      expect(content).toContain("cron.schedule('0 3 * * *'");
      expect(content).toContain('deleteOldDocuments()');
    });

    it('should have correct cron schedule for expiration reminders', () => {
      const fs = require('fs');
      const path = require('path');
      const jobsFilePath = path.join(__dirname, '../../src/jobs/kyc-jobs.ts');
      const content = fs.readFileSync(jobsFilePath, 'utf-8');
      
      // Verify the cron schedule is set to run daily at 10:00 AM
      expect(content).toContain("cron.schedule('0 10 * * *'");
      expect(content).toContain('sendExpirationReminders()');
    });

    it('should have correct cron schedule for alerts (Requisito 33.12-33.13)', () => {
      const fs = require('fs');
      const path = require('path');
      const jobsFilePath = path.join(__dirname, '../../src/jobs/kyc-jobs.ts');
      const content = fs.readFileSync(jobsFilePath, 'utf-8');
      
      // Verify the cron schedule is set to run every hour
      expect(content).toContain("cron.schedule('0 * * * *'");
      expect(content).toContain('checkAndSendAlerts()');
    });
  });

  describe('Job Initialization', () => {
    it('should call all schedule functions when initialized', () => {
      const fs = require('fs');
      const path = require('path');
      const jobsFilePath = path.join(__dirname, '../../src/jobs/kyc-jobs.ts');
      const content = fs.readFileSync(jobsFilePath, 'utf-8');
      
      // Verify initializeKYCJobs calls all schedule functions
      expect(content).toContain('scheduleExpiredVerificationsCheck()');
      expect(content).toContain('scheduleOldDocumentsDeletion()');
      expect(content).toContain('scheduleExpirationReminders()');
      expect(content).toContain('scheduleAlerts()');
    });

    it('should be called from index.ts', () => {
      const fs = require('fs');
      const path = require('path');
      const indexFilePath = path.join(__dirname, '../../src/index.ts');
      const content = fs.readFileSync(indexFilePath, 'utf-8');
      
      // Verify index.ts imports and calls initializeKYCJobs
      expect(content).toContain('initializeKYCJobs');
      expect(content).toContain('initializeKYCJobs()');
    });
  });

  describe('Job Logging', () => {
    it('should have logging for expired verifications check', () => {
      const fs = require('fs');
      const path = require('path');
      const jobsFilePath = path.join(__dirname, '../../src/jobs/kyc-jobs.ts');
      const content = fs.readFileSync(jobsFilePath, 'utf-8');
      
      // Verify logging is present
      expect(content).toContain('console.log');
      expect(content).toContain('console.error');
      expect(content).toContain('[KYC Job]');
    });
  });

  describe('Unit Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Suprimir console.log en tests
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('deleteOldDocuments', () => {
      it('should delete documents older than 90 days', async () => {
        // Arrange
        const now = new Date();
        const oldDate = new Date(now);
        oldDate.setDate(oldDate.getDate() - 100); // 100 días atrás

        const mockVerification = {
          id: 1,
          userId: 1,
          status: 'approved',
          verifiedAt: oldDate,
          documentFrontUrl: 'http://example.com/front.jpg',
          documentBackUrl: 'http://example.com/back.jpg',
          update: jest.fn().mockResolvedValue(undefined)
        };

        const mockDocuments = [
          {
            id: 1,
            verificationId: 1,
            encryptedUrl: 'http://example.com/storage/kyc/front-encrypted.jpg'
          },
          {
            id: 2,
            verificationId: 1,
            encryptedUrl: 'http://example.com/storage/kyc/back-encrypted.jpg'
          }
        ];

        (KYCVerification.findAll as jest.Mock).mockResolvedValue([mockVerification]);
        (KYCDocument.findAll as jest.Mock).mockResolvedValue(mockDocuments);
        
        const mockStorageService = StorageService.prototype;
        (mockStorageService.exists as jest.Mock) = jest.fn().mockResolvedValue(true);
        (mockStorageService.delete as jest.Mock) = jest.fn().mockResolvedValue(undefined);

        // Act
        await deleteOldDocuments();

        // Assert
        expect(KYCVerification.findAll).toHaveBeenCalled();
        expect(KYCDocument.findAll).toHaveBeenCalledWith({
          where: { verificationId: 1 }
        });
        expect(mockVerification.update).toHaveBeenCalledWith({
          documentFrontUrl: null,
          documentBackUrl: null,
          selfieUrl: null,
          selfieWithDocumentUrl: null,
          livenessVideoUrl: null,
          proofOfAddressUrl: null
        });
      });

      it('should handle errors gracefully when deleting files', async () => {
        // Arrange
        const now = new Date();
        const oldDate = new Date(now);
        oldDate.setDate(oldDate.getDate() - 100);

        const mockVerification = {
          id: 1,
          userId: 1,
          status: 'approved',
          verifiedAt: oldDate,
          documentFrontUrl: 'http://example.com/front.jpg',
          update: jest.fn().mockResolvedValue(undefined)
        };

        const mockDocuments = [
          {
            id: 1,
            verificationId: 1,
            encryptedUrl: 'http://example.com/storage/kyc/front-encrypted.jpg'
          }
        ];

        (KYCVerification.findAll as jest.Mock).mockResolvedValue([mockVerification]);
        (KYCDocument.findAll as jest.Mock).mockResolvedValue(mockDocuments);
        
        const mockStorageService = StorageService.prototype;
        (mockStorageService.exists as jest.Mock) = jest.fn().mockResolvedValue(true);
        (mockStorageService.delete as jest.Mock) = jest.fn().mockRejectedValue(new Error('Delete failed'));

        // Act
        await deleteOldDocuments();

        // Assert - Should still update the verification even if file deletion fails
        expect(mockVerification.update).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
      });
    });

    describe('sendExpirationReminders', () => {
      it('should send reminders for verifications expiring in 30 days', async () => {
        // Arrange
        const now = new Date();
        const in30Days = new Date(now);
        in30Days.setDate(in30Days.getDate() + 30);

        const mockVerifications = [
          {
            id: 1,
            userId: 1,
            status: 'approved',
            expiresAt: in30Days
          },
          {
            id: 2,
            userId: 2,
            status: 'approved',
            expiresAt: in30Days
          }
        ];

        (KYCVerification.findAll as jest.Mock)
          .mockResolvedValueOnce(mockVerifications) // Primera llamada: 30 días
          .mockResolvedValueOnce([]); // Segunda llamada: 7 días

        const mockNotificationService = NotificationService.prototype;
        (mockNotificationService.sendExpirationReminderEmail as jest.Mock) = jest.fn().mockResolvedValue(undefined);

        // Act
        await sendExpirationReminders();

        // Assert
        expect(mockNotificationService.sendExpirationReminderEmail).toHaveBeenCalledTimes(2);
        expect(mockNotificationService.sendExpirationReminderEmail).toHaveBeenCalledWith(1, 30);
        expect(mockNotificationService.sendExpirationReminderEmail).toHaveBeenCalledWith(2, 30);
      });

      it('should send reminders for verifications expiring in 7 days', async () => {
        // Arrange
        const now = new Date();
        const in7Days = new Date(now);
        in7Days.setDate(in7Days.getDate() + 7);

        const mockVerifications = [
          {
            id: 3,
            userId: 3,
            status: 'approved',
            expiresAt: in7Days
          }
        ];

        (KYCVerification.findAll as jest.Mock)
          .mockResolvedValueOnce([]) // Primera llamada: 30 días
          .mockResolvedValueOnce(mockVerifications); // Segunda llamada: 7 días

        const mockNotificationService = NotificationService.prototype;
        (mockNotificationService.sendExpirationReminderEmail as jest.Mock) = jest.fn().mockResolvedValue(undefined);

        // Act
        await sendExpirationReminders();

        // Assert
        expect(mockNotificationService.sendExpirationReminderEmail).toHaveBeenCalledTimes(1);
        expect(mockNotificationService.sendExpirationReminderEmail).toHaveBeenCalledWith(3, 7);
      });

      it('should handle errors when sending reminders', async () => {
        // Arrange
        const now = new Date();
        const in30Days = new Date(now);
        in30Days.setDate(in30Days.getDate() + 30);

        const mockVerifications = [
          {
            id: 1,
            userId: 1,
            status: 'approved',
            expiresAt: in30Days
          }
        ];

        (KYCVerification.findAll as jest.Mock)
          .mockResolvedValueOnce(mockVerifications)
          .mockResolvedValueOnce([]);

        const mockNotificationService = NotificationService.prototype;
        (mockNotificationService.sendExpirationReminderEmail as jest.Mock) = jest.fn()
          .mockRejectedValue(new Error('Email failed'));

        // Act
        await sendExpirationReminders();

        // Assert
        expect(console.error).toHaveBeenCalled();
      });

      it('should not send reminders for expired verifications', async () => {
        // Arrange
        (KYCVerification.findAll as jest.Mock)
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]);

        const mockNotificationService = NotificationService.prototype;
        (mockNotificationService.sendExpirationReminderEmail as jest.Mock) = jest.fn();

        // Act
        await sendExpirationReminders();

        // Assert
        expect(mockNotificationService.sendExpirationReminderEmail).not.toHaveBeenCalled();
      });
    });

    describe('checkAndSendAlerts (Requisito 33.12-33.13)', () => {
      it('should call alertService.checkAndSendAlerts', async () => {
        // Arrange
        const mockCheckAndSendAlerts = jest.spyOn(alertService, 'checkAndSendAlerts')
          .mockResolvedValue(undefined);

        // Act
        await checkAndSendAlerts();

        // Assert
        expect(mockCheckAndSendAlerts).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('[KYC Jobs] Iniciando verificación de alertas...');
        expect(console.log).toHaveBeenCalledWith('[KYC Jobs] Verificación de alertas completada');
      });

      it('should handle errors gracefully', async () => {
        // Arrange
        const error = new Error('Alert service failed');
        jest.spyOn(alertService, 'checkAndSendAlerts')
          .mockRejectedValue(error);

        // Act & Assert
        await expect(checkAndSendAlerts()).rejects.toThrow('Alert service failed');
        expect(console.error).toHaveBeenCalledWith('[KYC Jobs] Error en checkAndSendAlerts:', error);
      });
    });
  });
});
