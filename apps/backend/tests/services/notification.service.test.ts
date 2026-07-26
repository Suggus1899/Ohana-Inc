import { NotificationService } from '../../src/services/notification.service';
import nodemailer from 'nodemailer';
import User from '../../src/models/User';

// Mock nodemailer
jest.mock('nodemailer');

// Mock User model
jest.mock('../../src/models/User');

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockSendMail: jest.Mock;
  let mockTransporter: any;

  beforeEach(() => {
    // Setup mock transporter
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    mockTransporter = {
      sendMail: mockSendMail
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    // Setup environment variables
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASSWORD = 'testpass';
    process.env.EMAIL_FROM = 'noreply@habitas.com';
    process.env.PANEL_URL = 'https://habitas.com/panel/verificacion';

    notificationService = new NotificationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendDocumentsReceivedEmail', () => {
    it('should send documents received email to user', async () => {
      const mockUser = {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan@test.com'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await notificationService.sendDocumentsReceivedEmail(1);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@habitas.com',
          to: 'juan@test.com',
          subject: 'Documentos Recibidos - Verificación de Identidad',
          html: expect.stringContaining('Juan Pérez')
        })
      );
    });

    it('should throw error if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(notificationService.sendDocumentsReceivedEmail(999))
        .rejects.toThrow('User with id 999 not found');
    });
  });

  describe('sendPendingReviewEmail', () => {
    it('should send pending review email to user', async () => {
      const mockUser = {
        id: 1,
        name: 'María García',
        email: 'maria@test.com'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await notificationService.sendPendingReviewEmail(1);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'maria@test.com',
          subject: 'Verificación en Revisión - Habitas',
          html: expect.stringContaining('María García')
        })
      );
    });
  });

  describe('sendApprovalEmail', () => {
    it('should send approval email with success badge', async () => {
      const mockUser = {
        id: 1,
        name: 'Carlos López',
        email: 'carlos@test.com'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await notificationService.sendApprovalEmail(1);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'carlos@test.com',
          subject: '¡Verificación Aprobada! - Habitas',
          html: expect.stringContaining('Carlos López')
        })
      );

      const emailHtml = mockSendMail.mock.calls[0][0].html;
      expect(emailHtml).toContain('aprobada');
      expect(emailHtml).toContain('✓');
    });
  });

  describe('sendRejectionEmail', () => {
    it('should send rejection email with reason', async () => {
      const mockUser = {
        id: 1,
        name: 'Ana Martínez',
        email: 'ana@test.com'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const reason = 'Documento borroso o ilegible';
      await notificationService.sendRejectionEmail(1, reason);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ana@test.com',
          subject: 'Verificación Rechazada - Habitas',
          html: expect.stringContaining(reason)
        })
      );

      const emailHtml = mockSendMail.mock.calls[0][0].html;
      expect(emailHtml).toContain('Ana Martínez');
      expect(emailHtml).toContain('Intentar Nuevamente');
    });

    it('should not include sensitive information in rejection email', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await notificationService.sendRejectionEmail(1, 'Test reason');

      const emailHtml = mockSendMail.mock.calls[0][0].html;
      // Should not include sensitive data like scores or document images
      expect(emailHtml).not.toContain('score');
      expect(emailHtml).not.toContain('puntuación');
      expect(emailHtml).not.toContain('base64');
      expect(emailHtml).not.toContain('data:image');
    });
  });

  describe('sendExpirationReminderEmail', () => {
    it('should send expiration reminder with days until expiration', async () => {
      const mockUser = {
        id: 1,
        name: 'Pedro Sánchez',
        email: 'pedro@test.com'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await notificationService.sendExpirationReminderEmail(1, 30);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'pedro@test.com',
          subject: 'Recordatorio: Tu Verificación Está por Expirar - Habitas',
          html: expect.stringContaining('30 días')
        })
      );
    });
  });

  describe('sendExpiredEmail', () => {
    it('should send expired email to user', async () => {
      const mockUser = {
        id: 1,
        name: 'Laura Fernández',
        email: 'laura@test.com'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await notificationService.sendExpiredEmail(1);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'laura@test.com',
          subject: 'Tu Verificación ha Expirado - Habitas',
          html: expect.stringContaining('Laura Fernández')
        })
      );
    });
  });

  describe('Email templates', () => {
    it('should include Habitas branding in all emails', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await notificationService.sendDocumentsReceivedEmail(1);

      const emailHtml = mockSendMail.mock.calls[0][0].html;
      expect(emailHtml).toContain('Habitas');
      expect(emailHtml).toContain('Verificación de Identidad');
    });

    it('should include panel link in all emails', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await notificationService.sendApprovalEmail(1);

      const emailHtml = mockSendMail.mock.calls[0][0].html;
      expect(emailHtml).toContain('https://habitas.com/panel/verificacion');
    });

    it('should use professional HTML styling', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await notificationService.sendDocumentsReceivedEmail(1);

      const emailHtml = mockSendMail.mock.calls[0][0].html;
      expect(emailHtml).toContain('<!DOCTYPE html>');
      expect(emailHtml).toContain('style=');
      expect(emailHtml).toContain('background-color');
    });
  });

  describe('SMTP Configuration', () => {
    it('should configure SMTP transport with environment variables', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.test.com',
          port: 587,
          secure: false,
          auth: {
            user: 'test@test.com',
            pass: 'testpass'
          }
        })
      );
    });
  });
});
