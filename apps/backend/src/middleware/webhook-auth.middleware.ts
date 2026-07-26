import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Verifies Resend webhook signature using HMAC-SHA256.
 * Resend sends the signature in the `Resend-Webhook-Signature` header.
 * The signature is computed over the raw request body using the webhook signing secret.
 *
 * If RESEND_WEBHOOK_SECRET is not set, the middleware falls through with a warning
 * (useful for development). In production, the secret MUST be set.
 */
export function verifyResendWebhook(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('[Webhook] RESEND_WEBHOOK_SECRET not set — skipping signature verification. Set it in production!');
    next();
    return;
  }

  const signature = req.headers['resend-webhook-signature'] as string | undefined;
  const rawBody = (req as any).rawBody as Buffer | undefined;

  if (!signature) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing webhook signature' } });
    return;
  }

  if (!rawBody) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing raw body' } });
    return;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  // Use timing-safe comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } });
    return;
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } });
    return;
  }

  next();
}
