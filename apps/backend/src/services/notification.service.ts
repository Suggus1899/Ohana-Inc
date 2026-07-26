import nodemailer, { Transporter } from 'nodemailer';
import User from '../models/User';

/**
 * Servicio de notificaciones por email para el sistema KYC
 * 
 * Este servicio maneja el envío de emails relacionados con el proceso
 * de verificación de identidad, incluyendo confirmaciones, aprobaciones,
 * rechazos y recordatorios de expiración.
 * 
 * Requisitos: 23.1-23.10
 */
export class NotificationService {
  private transporter: Transporter;
  private fromEmail: string;
  private panelUrl: string;

  constructor() {
    // Configurar transporte SMTP con variables de entorno (Requisito 37.7)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    this.fromEmail = process.env.EMAIL_FROM || 'noreply@habitas.com';
    this.panelUrl = process.env.PANEL_URL || 'https://habitas.com/panel/verificacion';
  }

  /**
   * Envía email de confirmación de recepción de documentos
   * Requisito 23.1
   */
  async sendDocumentsReceivedEmail(userId: number): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const subject = 'Documentos Recibidos - Verificación de Identidad';
    const html = this.getDocumentsReceivedTemplate(user.name);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Envía email informando que la verificación está en revisión manual
   * Requisito 23.2
   */
  async sendPendingReviewEmail(userId: number): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const subject = 'Verificación en Revisión - Habitas';
    const html = this.getPendingReviewTemplate(user.name);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Envía email de felicitación por aprobación de verificación
   * Requisito 23.3
   */
  async sendApprovalEmail(userId: number): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const subject = '¡Verificación Aprobada! - Habitas';
    const html = this.getApprovalTemplate(user.name);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Envía email de rechazo con razón y pasos para reintentar
   * Requisito 23.4
   */
  async sendRejectionEmail(userId: number, reason: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const subject = 'Verificación Rechazada - Habitas';
    const html = this.getRejectionTemplate(user.name, reason);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Envía email de recordatorio de expiración próxima
   * Requisito 23.5
   */
  async sendExpirationReminderEmail(userId: number, daysUntilExpiration: number): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const subject = 'Recordatorio: Tu Verificación Está por Expirar - Habitas';
    const html = this.getExpirationReminderTemplate(user.name, daysUntilExpiration);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Envía email informando que la verificación ha expirado
   * Requisito 23.6
   */
  async sendExpiredEmail(userId: number): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const subject = 'Tu Verificación ha Expirado - Habitas';
    const html = this.getExpiredTemplate(user.name);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Envía alerta a operadores cuando la cola de revisión excede el umbral
   * Requisito 33.12
   */
  async sendPendingQueueAlert(pendingCount: number): Promise<void> {
    const recipients = this.getAlertRecipients();
    if (recipients.length === 0) {
      console.warn('No alert recipients configured. Skipping pending queue alert.');
      return;
    }

    const subject = '🚨 Alerta: Cola de Revisión KYC Excesiva';
    const html = this.getPendingQueueAlertTemplate(pendingCount);

    for (const recipient of recipients) {
      await this.sendEmail(recipient.email, subject, html);
    }
  }

  /**
   * Envía alerta a operadores cuando la tasa de rechazo excede el umbral
   * Requisito 33.13
   */
  async sendRejectionRateAlert(rejectionRate: number, totalToday: number, rejectedToday: number): Promise<void> {
    const recipients = this.getAlertRecipients();
    if (recipients.length === 0) {
      console.warn('No alert recipients configured. Skipping rejection rate alert.');
      return;
    }

    const subject = '🚨 Alerta: Tasa de Rechazo KYC Elevada';
    const html = this.getRejectionRateAlertTemplate(rejectionRate, totalToday, rejectedToday);

    for (const recipient of recipients) {
      await this.sendEmail(recipient.email, subject, html);
    }
  }

  /**
   * Obtiene la lista de destinatarios de alertas desde variables de entorno
   * Formato: email1:Nombre1,email2:Nombre2
   * Requisito 33.12, 33.13
   */
  private getAlertRecipients(): Array<{ email: string; name: string }> {
    const recipientsEnv = process.env.ALERT_RECIPIENTS;
    if (!recipientsEnv) {
      return [];
    }

    const recipients: Array<{ email: string; name: string }> = [];
    const pairs = recipientsEnv.split(',');

    for (const pair of pairs) {
      const [email, name] = pair.trim().split(':');
      if (email && name) {
        recipients.push({ email: email.trim(), name: name.trim() });
      }
    }

    return recipients;
  }

  /**
   * Método privado para enviar emails
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromEmail,
      to,
      subject,
      html
    });
  }

  /**
   * Plantilla base HTML con estilos profesionales
   * Requisitos 23.7, 23.8, 23.9
   */
  private getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Habitas - Verificación de Identidad</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header con logo -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Habitas</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Verificación de Identidad</p>
            </td>
          </tr>
          
          <!-- Contenido -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                © ${new Date().getFullYear()} Habitas. Todos los derechos reservados.
              </p>
              <p style="margin: 0; color: #6c757d; font-size: 12px;">
                Este es un correo automático, por favor no responder.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Plantilla: Documentos recibidos
   * Requisito 23.1, 23.10 (no incluir información sensible)
   */
  private getDocumentsReceivedTemplate(userName: string): string {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">¡Hola ${userName}!</h2>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Hemos recibido tus documentos de verificación de identidad correctamente.
      </p>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Nuestro sistema está procesando tu información y pronto recibirás una actualización sobre el estado de tu verificación.
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
        <p style="margin: 0; color: #1976D2; font-size: 14px; line-height: 1.6;">
          <strong>Próximos pasos:</strong><br>
          • Validación automática de documentos<br>
          • Verificación biométrica<br>
          • Revisión manual por nuestro equipo
        </p>
      </div>
      
      <p style="margin: 30px 0 0 0; text-align: center;">
        <a href="${this.panelUrl}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Ver Estado de Verificación
        </a>
      </p>
    `;
    
    return this.getBaseTemplate(content);
  }

  /**
   * Plantilla: En revisión manual
   * Requisito 23.2
   */
  private getPendingReviewTemplate(userName: string): string {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">¡Buenas noticias, ${userName}!</h2>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Tu verificación ha pasado la validación automática exitosamente.
      </p>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Ahora tu solicitud está en revisión manual por nuestro equipo de operadores. Este proceso puede tomar entre 24 y 48 horas.
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
          <strong>Estado actual:</strong> En revisión manual<br>
          <strong>Tiempo estimado:</strong> 24-48 horas
        </p>
      </div>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Te notificaremos por email cuando la revisión esté completa.
      </p>
      
      <p style="margin: 30px 0 0 0; text-align: center;">
        <a href="${this.panelUrl}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Ver Estado de Verificación
        </a>
      </p>
    `;
    
    return this.getBaseTemplate(content);
  }

  /**
   * Plantilla: Verificación aprobada
   * Requisito 23.3
   */
  private getApprovalTemplate(userName: string): string {
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; width: 80px; height: 80px; background-color: #4caf50; border-radius: 50%; line-height: 80px;">
          <span style="color: #ffffff; font-size: 40px;">✓</span>
        </div>
      </div>
      
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; text-align: center;">¡Felicitaciones, ${userName}!</h2>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6; text-align: center;">
        Tu verificación de identidad ha sido <strong style="color: #4caf50;">aprobada</strong>.
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
        <p style="margin: 0; color: #2e7d32; font-size: 14px; line-height: 1.6;">
          <strong>✓ Cuenta verificada</strong><br>
          Ahora tienes acceso completo a todas las funcionalidades de Habitas.
        </p>
      </div>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Tu verificación es válida por 1 año. Te enviaremos un recordatorio antes de que expire.
      </p>
      
      <p style="margin: 30px 0 0 0; text-align: center;">
        <a href="${this.panelUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4caf50; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Ir al Panel
        </a>
      </p>
    `;
    
    return this.getBaseTemplate(content);
  }

  /**
   * Plantilla: Verificación rechazada
   * Requisito 23.4, 23.10 (no incluir puntuaciones)
   */
  private getRejectionTemplate(userName: string, reason: string): string {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Hola ${userName},</h2>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Lamentamos informarte que tu verificación de identidad no ha sido aprobada.
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #ffebee; border-left: 4px solid #f44336; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #c62828; font-size: 14px; font-weight: 600;">
          Razón del rechazo:
        </p>
        <p style="margin: 0; color: #c62828; font-size: 14px; line-height: 1.6;">
          ${reason}
        </p>
      </div>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        <strong>Pasos para reintentar:</strong>
      </p>
      
      <ol style="margin: 0 0 15px 0; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
        <li>Revisa la razón del rechazo</li>
        <li>Prepara documentos de mejor calidad</li>
        <li>Asegúrate de que la foto sea clara y bien iluminada</li>
        <li>Inicia un nuevo proceso de verificación</li>
      </ol>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Puedes intentar nuevamente cuando estés listo.
      </p>
      
      <p style="margin: 30px 0 0 0; text-align: center;">
        <a href="${this.panelUrl}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Intentar Nuevamente
        </a>
      </p>
    `;
    
    return this.getBaseTemplate(content);
  }

  /**
   * Plantilla: Recordatorio de expiración
   * Requisito 23.5
   */
  private getExpirationReminderTemplate(userName: string, daysUntilExpiration: number): string {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Hola ${userName},</h2>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Te recordamos que tu verificación de identidad está próxima a expirar.
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
          <strong>⚠️ Días restantes:</strong> ${daysUntilExpiration} días<br>
          <strong>Acción requerida:</strong> Renovar verificación
        </p>
      </div>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Para mantener tu cuenta verificada y acceso completo a Habitas, necesitas renovar tu verificación antes de que expire.
      </p>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        El proceso de renovación es rápido y similar al proceso inicial.
      </p>
      
      <p style="margin: 30px 0 0 0; text-align: center;">
        <a href="${this.panelUrl}" style="display: inline-block; padding: 14px 32px; background-color: #ffc107; color: #000000; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Renovar Verificación
        </a>
      </p>
    `;
    
    return this.getBaseTemplate(content);
  }

  /**
   * Plantilla: Verificación expirada
   * Requisito 23.6
   */
  private getExpiredTemplate(userName: string): string {
    const content = `
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Hola ${userName},</h2>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Tu verificación de identidad ha expirado.
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #ffebee; border-left: 4px solid #f44336; border-radius: 4px;">
        <p style="margin: 0; color: #c62828; font-size: 14px; line-height: 1.6;">
          <strong>Estado:</strong> Verificación expirada<br>
          <strong>Nivel de acceso:</strong> Reducido a básico
        </p>
      </div>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Para recuperar el acceso completo a todas las funcionalidades de Habitas, necesitas renovar tu verificación.
      </p>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        <strong>¿Por qué necesitas renovar?</strong>
      </p>
      
      <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
        <li>Mantener la seguridad de la plataforma</li>
        <li>Cumplir con regulaciones de protección de datos</li>
        <li>Garantizar información actualizada</li>
      </ul>
      
      <p style="margin: 30px 0 0 0; text-align: center;">
        <a href="${this.panelUrl}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Renovar Ahora
        </a>
      </p>
    `;
    
    return this.getBaseTemplate(content);
  }

  /**
   * Plantilla: Alerta de cola de revisión excesiva
   * Requisito 33.12
   */
  private getPendingQueueAlertTemplate(pendingCount: number): string {
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; width: 80px; height: 80px; background-color: #ff9800; border-radius: 50%; line-height: 80px;">
          <span style="color: #ffffff; font-size: 40px;">⚠️</span>
        </div>
      </div>
      
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; text-align: center;">Alerta: Cola de Revisión KYC Excesiva</h2>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        El sistema de verificación KYC ha detectado una acumulación excesiva de verificaciones pendientes de revisión manual.
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ff9800; border-radius: 4px;">
        <p style="margin: 0; color: #856404; font-size: 18px; line-height: 1.6; text-align: center;">
          <strong>Verificaciones pendientes:</strong> <span style="font-size: 32px; color: #ff9800;">${pendingCount}</span>
        </p>
        <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px; text-align: center;">
          Umbral de alerta: 100 verificaciones
        </p>
      </div>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        <strong>Acciones recomendadas:</strong>
      </p>
      
      <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
        <li>Asignar más operadores a la revisión de verificaciones</li>
        <li>Priorizar las verificaciones más antiguas</li>
        <li>Revisar si hay problemas técnicos que estén ralentizando el proceso</li>
        <li>Considerar aumentar la capacidad del equipo de revisión</li>
      </ul>
      
      <p style="margin: 30px 0 0 0; text-align: center;">
        <a href="${this.panelUrl}/admin/pending" style="display: inline-block; padding: 14px 32px; background-color: #ff9800; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Ver Cola de Revisión
        </a>
      </p>
      
      <div style="margin: 30px 0 0 0; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
        <p style="margin: 0; color: #6c757d; font-size: 12px; text-align: center;">
          Esta alerta se envía automáticamente cuando la cola de revisión excede 100 verificaciones pendientes.<br>
          Fecha y hora: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Caracas' })}
        </p>
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  /**
   * Plantilla: Alerta de tasa de rechazo elevada
   * Requisito 33.13
   */
  private getRejectionRateAlertTemplate(rejectionRate: number, totalToday: number, rejectedToday: number): string {
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; width: 80px; height: 80px; background-color: #f44336; border-radius: 50%; line-height: 80px;">
          <span style="color: #ffffff; font-size: 40px;">🚨</span>
        </div>
      </div>
      
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; text-align: center;">Alerta: Tasa de Rechazo KYC Elevada</h2>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        El sistema de verificación KYC ha detectado una tasa de rechazo inusualmente alta en las verificaciones procesadas hoy.
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #ffebee; border-left: 4px solid #f44336; border-radius: 4px;">
        <p style="margin: 0; color: #c62828; font-size: 18px; line-height: 1.6; text-align: center;">
          <strong>Tasa de rechazo:</strong> <span style="font-size: 32px; color: #f44336;">${rejectionRate.toFixed(1)}%</span>
        </p>
        <p style="margin: 10px 0 0 0; color: #c62828; font-size: 14px; text-align: center;">
          Umbral de alerta: 30%
        </p>
      </div>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 4px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; text-align: center; border-right: 1px solid #dee2e6;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">Total Revisadas Hoy</p>
              <p style="margin: 5px 0 0 0; color: #333333; font-size: 24px; font-weight: 600;">${totalToday}</p>
            </td>
            <td style="padding: 10px; text-align: center;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">Rechazadas Hoy</p>
              <p style="margin: 5px 0 0 0; color: #f44336; font-size: 24px; font-weight: 600;">${rejectedToday}</p>
            </td>
          </tr>
        </table>
      </div>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        <strong>Posibles causas:</strong>
      </p>
      
      <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
        <li>Problemas con la calidad de las imágenes capturadas</li>
        <li>Errores en el proceso de validación automática</li>
        <li>Documentos fraudulentos o manipulados</li>
        <li>Cambios en los criterios de revisión de operadores</li>
        <li>Problemas técnicos con OCR o reconocimiento facial</li>
      </ul>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        <strong>Acciones recomendadas:</strong>
      </p>
      
      <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
        <li>Revisar las razones más comunes de rechazo</li>
        <li>Verificar el funcionamiento de los servicios de validación automática</li>
        <li>Analizar si hay patrones en los rechazos</li>
        <li>Considerar mejorar las instrucciones para usuarios</li>
        <li>Revisar los umbrales de validación automática</li>
      </ul>
      
      <p style="margin: 30px 0 0 0; text-align: center;">
        <a href="${this.panelUrl}/admin/metrics" style="display: inline-block; padding: 14px 32px; background-color: #f44336; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Ver Métricas Detalladas
        </a>
      </p>
      
      <div style="margin: 30px 0 0 0; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
        <p style="margin: 0; color: #6c757d; font-size: 12px; text-align: center;">
          Esta alerta se envía automáticamente cuando la tasa de rechazo diaria excede 30%.<br>
          Fecha y hora: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Caracas' })}
        </p>
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  /**
   * Notifica a los operadores que hay una nueva verificación KYC pendiente de revisión
   * 
   * @param userId - ID del usuario que completó el KYC nivel 3
   */
  async notifyOperatorsNewKYCPending(userId: number): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        console.error(`User ${userId} not found for KYC pending notification`);
        return;
      }

      const recipients = this.getAlertRecipients();
      const subject = '🔔 Nueva Verificación KYC Pendiente de Revisión';
      const html = this.getNewKYCPendingTemplate(user.name || user.email);

      for (const recipient of recipients) {
        await this.sendEmail(recipient.email, subject, html);
      }

      console.log(`New KYC pending notification sent to ${recipients.length} operators for user ${userId}`);
    } catch (error) {
      console.error('Error sending new KYC pending notification:', error);
    }
  }

  /**
   * Plantilla: Nueva verificación KYC pendiente
   */
  private getNewKYCPendingTemplate(userName: string): string {
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; width: 80px; height: 80px; background-color: #2196F3; border-radius: 50%; line-height: 80px;">
          <span style="color: #ffffff; font-size: 40px;">📋</span>
        </div>
      </div>
      
      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; text-align: center;">Nueva Verificación KYC Pendiente</h2>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Un estudiante ha completado todos los niveles del proceso KYC y su solicitud está lista para revisión.
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
        <p style="margin: 0; color: #1565c0; font-size: 16px; line-height: 1.6;">
          <strong>Usuario:</strong> ${userName}
        </p>
        <p style="margin: 10px 0 0 0; color: #1565c0; font-size: 14px;">
          Estado: Nivel 3 completado - Pendiente de revisión
        </p>
      </div>
      
      <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
        Por favor, revisa la solicitud en el panel de operador para aprobar o rechazar la verificación.
      </p>
      
      <p style="margin: 30px 0 0 0; text-align: center;">
        <a href="${this.panelUrl}/admin/kyc/pending" style="display: inline-block; padding: 14px 32px; background-color: #2196F3; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Ir al Panel de Aprobaciones
        </a>
      </p>
      
      <div style="margin: 30px 0 0 0; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
        <p style="margin: 0; color: #6c757d; font-size: 12px; text-align: center;">
          Fecha y hora: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Caracas' })}
        </p>
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }
}
