import Transaction from '../models/Transaction';
import Dispute from '../models/Dispute';
import User from '../models/User';
import { getIO } from '../websocket/socket';
import { badgeService } from './badge.service';

export class TransactionNotificationService {
  private getIO() {
    try {
      return getIO();
    } catch {
      return null;
    }
  }

  private async emitBadgeUpdate(userId: number): Promise<void> {
    const io = this.getIO();
    if (!io) return;
    try {
      const user = await User.findByPk(userId, { attributes: ['role'] });
      const role = user?.role || '';
      const counts = await badgeService.getCounts(userId, role);
      io.to(`user:${userId}`).emit('badge:update', counts);
    } catch {}
  }

  // Notificar al propietario sobre nueva solicitud
  public async notifyOwnerNewRequest(transaction: Transaction): Promise<void> {
    const io = this.getIO();
    if (io) {
      io.to(`user:${transaction.ownerId}`).emit('transaction:new_request', {
        transactionId: transaction.id,
        propertyId: transaction.propertyId,
        clientId: transaction.clientId,
        amount: transaction.amount,
        message: 'Tienes una nueva solicitud de transacción',
      });
    }

    await this.sendTransactionEmail(
      transaction.ownerId,
      'Nueva Solicitud de Transacción',
      `Has recibido una nueva solicitud de transacción por un monto de ${transaction.amount} ${transaction.currency}. Revisa y aprueba o rechaza la solicitud.`
    );

    await this.emitBadgeUpdate(transaction.ownerId);
  }

  // Notificar al cliente sobre aprobación
  public async notifyClientApproval(transaction: Transaction): Promise<void> {
    const io = this.getIO();
    if (io) {
      io.to(`user:${transaction.clientId}`).emit('transaction:approved', {
        transactionId: transaction.id,
        message: 'Tu solicitud fue aprobada. Procede con el pago.',
      });
    }

    await this.sendTransactionEmail(
      transaction.clientId,
      'Solicitud Aprobada',
      `Tu solicitud de transacción ha sido aprobada. Procede con el pago de ${transaction.amount} ${transaction.currency}.`
    );

    await this.emitBadgeUpdate(transaction.clientId);
  }

  // Notificar al cliente sobre rechazo
  public async notifyClientRejection(transaction: Transaction): Promise<void> {
    const io = this.getIO();
    if (io) {
      io.to(`user:${transaction.clientId}`).emit('transaction:rejected', {
        transactionId: transaction.id,
        message: 'Tu solicitud fue rechazada.',
      });
    }

    await this.sendTransactionEmail(
      transaction.clientId,
      'Solicitud Rechazada',
      `Tu solicitud de transacción ha sido rechazada.${transaction.notes ? ` Razón: ${transaction.notes}` : ''}`
    );

    await this.emitBadgeUpdate(transaction.clientId);
  }

  // Notificar al propietario sobre pago enviado
  public async notifyOwnerPaymentSubmitted(transaction: Transaction): Promise<void> {
    const io = this.getIO();
    if (io) {
      io.to(`user:${transaction.ownerId}`).emit('transaction:payment_submitted', {
        transactionId: transaction.id,
        message: '¡El cliente marcó el pago como realizado! Verifica y confirma.',
        urgent: true,
      });
    }

    await this.sendTransactionEmail(
      transaction.ownerId,
      '¡Pago Recibido! - Acción Requerida',
      `El cliente ha marcado el pago como realizado por ${transaction.amount} ${transaction.currency}. Verifica y confirma la recepción del pago.`
    );

    await this.emitBadgeUpdate(transaction.ownerId);
  }

  // Notificar al cliente sobre confirmación de pago
  public async notifyClientPaymentConfirmed(transaction: Transaction): Promise<void> {
    const io = this.getIO();
    if (io) {
      io.to(`user:${transaction.clientId}`).emit('transaction:payment_confirmed', {
        transactionId: transaction.id,
        message: '¡Pago confirmado! La propiedad ha sido asignada a tu nombre.',
      });
    }

    await this.sendTransactionEmail(
      transaction.clientId,
      '¡Transacción Completada!',
      `¡Pago confirmado! La propiedad ha sido asignada a tu nombre. Transacción por ${transaction.amount} ${transaction.currency} completada exitosamente.`
    );

    await this.emitBadgeUpdate(transaction.clientId);
  }

  // Notificar cancelación
  public async notifyTransactionCancelled(
    transaction: Transaction,
    userId: number
  ): Promise<void> {
    const io = this.getIO();
    if (io) {
      io.to(`user:${userId}`).emit('transaction:cancelled', {
        transactionId: transaction.id,
        message: 'La transacción ha sido cancelada.',
      });
    }

    await this.sendTransactionEmail(
      userId,
      'Transacción Cancelada',
      `La transacción #${transaction.id} ha sido cancelada.`
    );

    await this.emitBadgeUpdate(userId);
  }

  // Notificar a operadores sobre nueva disputa
  public async notifyOperatorsNewDispute(dispute: Dispute): Promise<void> {
    const io = this.getIO();
    if (io) {
      io.to('operators').emit('dispute:new', {
        disputeId: dispute.id,
        transactionId: dispute.transactionId,
        message: 'Nueva disputa requiere atención',
      });
    }
  }

  // Notificar resolución de disputa
  public async notifyDisputeResolved(dispute: Dispute): Promise<void> {
    const io = this.getIO();
    if (io) {
      io.to(`user:${dispute.reportedBy}`).emit('dispute:resolved', {
        disputeId: dispute.id,
        message: 'Tu disputa ha sido resuelta',
      });

      io.to(`user:${dispute.reportedAgainst}`).emit('dispute:resolved', {
        disputeId: dispute.id,
        message: 'Una disputa relacionada contigo ha sido resuelta',
      });
    }

    await this.sendTransactionEmail(
      dispute.reportedBy,
      'Disputa Resuelta',
      `Tu disputa #${dispute.id} ha sido resuelta.${dispute.resolution ? ` Resolución: ${dispute.resolution}` : ''}`
    );

    await this.sendTransactionEmail(
      dispute.reportedAgainst,
      'Disputa Resuelta',
      `Una disputa relacionada contigo (#${dispute.id}) ha sido resuelta.`
    );

    await this.emitBadgeUpdate(dispute.reportedBy);
    await this.emitBadgeUpdate(dispute.reportedAgainst);
  }

  // Notificar expiración
  public async notifyTransactionExpired(transaction: Transaction): Promise<void> {
    const io = this.getIO();
    const userIds = [transaction.clientId, transaction.ownerId];

    for (const userId of userIds) {
      if (io) {
        io.to(`user:${userId}`).emit('transaction:expired', {
          transactionId: transaction.id,
          message: 'La transacción ha expirado por tiempo límite.',
        });
      }

      await this.sendTransactionEmail(
        userId,
        'Transacción Expirada',
        `La transacción #${transaction.id} ha expirado por tiempo límite.`
      );

      await this.emitBadgeUpdate(userId);
    }
  }

  // Helper para enviar emails de transacción
  private async sendTransactionEmail(userId: number, subject: string, body: string): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.email) return;

      // Use nodemailer if configured, otherwise log
      if (process.env.SMTP_HOST) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@habitas.com',
          to: user.email,
          subject: `Habitas - ${subject}`,
          html: this.getEmailTemplate(user.name, subject, body),
        });
      } else {
        console.log(`📧 [Email] To: ${user.email} | Subject: ${subject} | Body: ${body}`);
      }
    } catch (error) {
      console.error('Error sending transaction email:', error);
    }
  }

  private getEmailTemplate(userName: string, title: string, body: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">Habitas</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b;">${title}</h2>
          <p style="color: #475569;">Hola ${userName},</p>
          <p style="color: #475569;">${body}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #94a3b8; font-size: 12px;">Este es un mensaje automático de Habitas. No responder a este correo.</p>
        </div>
      </body>
      </html>
    `;
  }
}
