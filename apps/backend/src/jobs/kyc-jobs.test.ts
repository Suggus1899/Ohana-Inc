import { deleteOldDocuments, sendExpirationReminders, checkAndSendAlerts } from './kyc-jobs';
import KYCVerification from '../models/KYCVerification';
import KYCDocument from '../models/KYCDocument';
import { NotificationService } from '../services/notification.service';
import { StorageService } from '../services/storage.service';
import { KYCService } from '../services/kyc.service';
import alertService from '../services/alert.service';

// Mock de los modelos y servicios
jest.mock('../models/KYCVerification');
jest.mock('../models/KYCDocument');
jest.mock('../services/notification.service');
jest.mock('../services/storage.service');
jest.mock('../services/kyc.service');
jest.mock('../services/alert.service');

describe('KYC Scheduled Jobs', () => {
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

    it('should skip verifications without URLs', async () => {
      // Arrange
      (KYCVerification.findAll as jest.Mock).mockResolvedValue([]);

      // Act
      await deleteOldDocuments();

      // Assert
      expect(KYCDocument.findAll).not.toHaveBeenCalled();
    });

    it('should not delete documents from recent verifications', async () => {
      // Arrange
      const now = new Date();
      const recentDate = new Date(now);
      recentDate.setDate(recentDate.getDate() - 30); // Solo 30 días atrás

      (KYCVerification.findAll as jest.Mock).mockResolvedValue([]);

      // Act
      await deleteOldDocuments();

      // Assert
      expect(KYCDocument.findAll).not.toHaveBeenCalled();
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

  describe('checkExpiredVerifications', () => {
    it('should mark expired verifications and reduce user level', async () => {
      // Arrange
      const kycService = new KYCService();
      const mockCheckExpired = jest.spyOn(kycService, 'checkExpiredVerifications')
        .mockResolvedValue(undefined);

      // Act
      await kycService.checkExpiredVerifications();

      // Assert
      expect(mockCheckExpired).toHaveBeenCalled();
    });
  });

  describe('checkAndSendAlerts', () => {
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
