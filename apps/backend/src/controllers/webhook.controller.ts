import { Request, Response } from 'express';
import { InboundEmail } from '../models';

/**
 * POST /api/webhooks/resend
 * Recibe correos entrantes vía webhook de Resend y los almacena en la base de datos
 */
export async function handleResendWebhook(req: Request, res: Response): Promise<void> {
  try {
    const payload = req.body;

    console.log('[Webhook] Resend webhook recibido:', JSON.stringify(payload).substring(0, 200));

    // Resend envía diferentes tipos de eventos
    const eventType = payload?.type;

    if (eventType === 'email.received' || payload?.data?.from) {
      // Correo entrante
      const data = payload.data || payload;

      await InboundEmail.create({
        from: data.from || data.sender || 'unknown',
        to: data.to || data.recipient || 'soporte@habitasweb.me',
        subject: data.subject || '(Sin asunto)',
        body: data.text || data.html || data.body || '',
        rawPayload: payload,
        receivedAt: data.created_at ? new Date(data.created_at) : new Date()
      });

      console.log(`[Webhook] Correo entrante almacenado de: ${data.from || 'unknown'}`);
    } else {
      // Otros eventos (delivery, bounce, complaint, etc.) - almacenar para referencia
      await InboundEmail.create({
        from: 'system',
        to: 'webhook',
        subject: `Evento: ${eventType || 'unknown'}`,
        body: JSON.stringify(payload),
        rawPayload: payload,
        receivedAt: new Date()
      });

      console.log(`[Webhook] Evento Resend almacenado: ${eventType}`);
    }

    // IMPORTANTE: Resend espera 200 OK rápidamente
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error procesando webhook de Resend:', error);
    // Aun con error, respondemos 200 para que Resend no reintente excesivamente
    res.status(200).json({ received: true, error: 'processed_with_error' });
  }
}
