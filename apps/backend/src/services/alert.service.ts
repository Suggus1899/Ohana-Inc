import nodemailer from 'nodemailer';
import { MetricsService } from './metrics.service';

/**
 * AlertService
 * 
 * Servicio para enviar alertas a operadores cuando se detectan condiciones críticas
 * en el sistema KYC.
 * 
 * Requisitos: 33.12-33.13
 */

export interface AlertRecipient {
  email: string;
  name: string;
}

export class AlertService {
  private transporter: nodemailer.Transporter;
  private metricsService: MetricsService;
  private alertRecipients: AlertRecipient[];

  constructor() {
    // Configurar transporte SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    this.metricsService = new MetricsService();

    // Configurar destinatarios de alertas desde variables de entorno
    this.alertRecipients = this.parseAlertRecipients();
  }

  /**
   * Parsea los destinatarios de alertas desde variables de entorno
   * Formato: ALERT_RECIPIENTS=email1@example.com:Name1,email2@example.com:Name2
   */
  private parseAlertRecipients(): AlertRecipient[] {
    const recipientsEnv = process.env.ALERT_RECIPIENTS || '';
    
    if (!recipientsEnv) {
      console.warn('ALERT_RECIPIENTS no configurado. Las alertas no se enviarán.');
      return [];
    }

    return recipientsEnv.split(',').map(recipient => {
      const [email, name] = recipient.trim().split(':');
      return {
        email: email.trim(),
        name: name?.trim() || email.trim()
      };
    });
  }

  /**
   * Verifica todas las condiciones de alerta y envía notificaciones si es necesario
   * Este método debe ser llamado periódicamente (ej: cada hora)
   */
  async checkAndSendAlerts(): Promise<void> {
    try {
      // Verificar alerta de cola de revisión
      const shouldAlertQueue = await this.metricsService.shouldAlertPendingQueue();
      if (shouldAlertQueue) {
        await this.sendPendingQueueAlert();
      }

      // Verificar alerta de tasa de rechazo
      const shouldAlertRejection = await this.metricsService.shouldAlertRejectionRate();
      if (shouldAlertRejection) {
        await this.sendRejectionRateAlert();
      }
    } catch (error) {
      console.error('Error al verificar y enviar alertas:', error);
    }
  }

  /**
   * Envía alerta cuando la cola de revisión excede 100 verificaciones
   * 
   * Requisito: 33.12
   */
  async sendPendingQueueAlert(): Promise<void> {
    if (this.alertRecipients.length === 0) {
      console.warn('No hay destinatarios configurados para alertas');
      return;
    }

    const pendingMetrics = await this.metricsService.getPendingMetrics();

    const subject = '⚠️ Alerta KYC: Cola de Revisión Excesiva';
    const html = this.getPendingQueueAlertTemplate(pendingMetrics.pendingCount, pendingMetrics.averageWaitTime);

    for (const recipient of this.alertRecipients) {
      await this.sendEmail(recipient.email, subject, html);
    }

    console.log(`Alerta de cola de revisión enviada a ${this.alertRecipients.length} destinatarios`);
  }

  /**
   * Envía alerta cuando la tasa de rechazo excede 30% en un día
   * 
   * Requisito: 33.13
   */
  async sendRejectionRateAlert(): Promise<void> {
    if (this.alertRecipients.length === 0) {
      console.warn('No hay destinatarios configurados para alertas');
      return;
    }

    const verificationMetrics = await this.metricsService.getVerificationMetrics();
    const rejectionReasons = await this.metricsService.getRejectionReasons();

    const subject = '⚠️ Alerta KYC: Tasa de Rechazo Alta';
    const html = this.getRejectionRateAlertTemplate(
      verificationMetrics.rejectionRate,
      verificationMetrics.rejectedCount,
      verificationMetrics.totalVerifications,
      rejectionReasons
    );

    for (const recipient of this.alertRecipients) {
      await this.sendEmail(recipient.email, subject, html);
    }

    console.log(`Alerta de tasa de rechazo enviada a ${this.alertRecipients.length} destinatarios`);
  }

  /**
   * Envía un email a un destinatario
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@habitas.com',
        to,
        subject,
        html: this.getBaseTemplate(html)
      });
    } catch (error) {
      console.error(`Error al enviar email a ${to}:`, error);
      throw error;
    }
  }

  /**
   * Plantilla base para emails de alerta
   */
  private getBaseTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .alert-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .metric {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 3px solid #667eea;
          }
          .metric-label {
            font-weight: bold;
            color: #667eea;
            font-size: 14px;
            text-transform: uppercase;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-top: 5px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 12px;
          }
          .reasons-list {
            list-style: none;
            padding: 0;
          }
          .reasons-list li {
            padding: 8px;
            margin: 5px 0;
            background: #f8f9fa;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏠 Habitas</div>
          <div>Sistema KYC - Alerta de Monitoreo</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Este es un mensaje automático del sistema de monitoreo KYC de Habitas.</p>
          <p>Por favor, no responda a este correo.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Plantilla para alerta de cola de revisión excesiva
   */
  private getPendingQueueAlertTemplate(pendingCount: number, averageWaitTime: number | null): string {
    const waitTimeText = averageWaitTime 
      ? `${averageWaitTime.toFixed(1)} horas` 
      : 'N/A';

    return `
      <h2>⚠️ Cola de Revisión Excesiva</h2>
      
      <div class="alert-box">
        <strong>Atención:</strong> La cola de verificaciones pendientes ha excedido el umbral de 100 verificaciones.
      </div>

      <p>Se requiere atención inmediata para revisar las verificaciones pendientes y evitar retrasos en el servicio.</p>

      <div class="metric">
        <div class="metric-label">Verificaciones Pendientes</div>
        <div class="metric-value">${pendingCount}</div>
      </div>

      <div class="metric">
        <div class="metric-label">Tiempo de Espera Promedio</div>
        <div class="metric-value">${waitTimeText}</div>
      </div>

      <h3>Acciones Recomendadas:</h3>
      <ul>
        <li>Asignar operadores adicionales para revisión</li>
        <li>Priorizar verificaciones más antiguas</li>
        <li>Revisar si hay problemas técnicos que estén causando el retraso</li>
      </ul>

      <a href="${process.env.PANEL_URL || 'https://habitas.com/panel/verificacion'}" class="button">
        Ir al Panel de Revisión
      </a>
    `;
  }

  /**
   * Plantilla para alerta de tasa de rechazo alta
   */
  private getRejectionRateAlertTemplate(
    rejectionRate: number,
    rejectedCount: number,
    totalVerifications: number,
    rejectionReasons: Array<{ reason: string; count: number; percentage: number }>
  ): string {
    const reasonsHtml = rejectionReasons.length > 0
      ? `
        <h3>Razones Principales de Rechazo:</h3>
        <ul class="reasons-list">
          ${rejectionReasons.slice(0, 5).map(r => `
            <li>
              <strong>${r.reason}</strong>: ${r.count} casos (${r.percentage.toFixed(1)}%)
            </li>
          `).join('')}
        </ul>
      `
      : '<p>No hay datos de razones de rechazo disponibles.</p>';

    return `
      <h2>⚠️ Tasa de Rechazo Alta</h2>
      
      <div class="alert-box">
        <strong>Atención:</strong> La tasa de rechazo de verificaciones ha excedido el 30% en el día actual.
      </div>

      <p>Una tasa de rechazo alta puede indicar problemas con la calidad de los documentos enviados, 
      problemas técnicos en el proceso de captura, o necesidad de ajustar los criterios de validación.</p>

      <div class="metric">
        <div class="metric-label">Tasa de Rechazo</div>
        <div class="metric-value">${rejectionRate.toFixed(1)}%</div>
      </div>

      <div class="metric">
        <div class="metric-label">Verificaciones Rechazadas Hoy</div>
        <div class="metric-value">${rejectedCount} de ${totalVerifications}</div>
      </div>

      ${reasonsHtml}

      <h3>Acciones Recomendadas:</h3>
      <ul>
        <li>Revisar las razones más comunes de rechazo</li>
        <li>Verificar si hay problemas técnicos en el proceso de captura</li>
        <li>Considerar mejorar las instrucciones para los usuarios</li>
        <li>Evaluar si los umbrales de validación son apropiados</li>
      </ul>

      <a href="${process.env.PANEL_URL || 'https://habitas.com/panel/verificacion'}" class="button">
        Ver Dashboard de Métricas
      </a>
    `;
  }

  /**
   * Configura destinatarios de alertas programáticamente
   * Útil para testing o configuración dinámica
   */
  setAlertRecipients(recipients: AlertRecipient[]): void {
    this.alertRecipients = recipients;
  }

  /**
   * Obtiene los destinatarios configurados
   */
  getAlertRecipients(): AlertRecipient[] {
    return [...this.alertRecipients];
  }
}

export default new AlertService();
