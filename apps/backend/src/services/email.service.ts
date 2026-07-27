import { Resend } from 'resend';
import { redis, isRedisConnected } from '../config/redis';
import { AuditLog } from '../models';

// Inicializar Resend con variable de entorno
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('[EmailService] ⚠️ RESEND_API_KEY no está configurada en las variables de entorno');
} else {
  console.log(`[EmailService] ✅ Resend API key cargada (${apiKey.substring(0, 6)}...)`);
}
const resend = new Resend(apiKey);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Ohana <soporte@Ohanaweb.me>';
console.log(`[EmailService] From email: ${FROM_EMAIL}`);
const DAILY_LIMIT = 3000;
const RATE_LIMIT_KEY = 'resend:daily_count';

/**
 * Verifica si se ha alcanzado el límite diario de envíos
 */
async function checkRateLimit(): Promise<{ allowed: boolean; count: number }> {
  if (!isRedisConnected()) {
    // Sin Redis, no podemos rastrear — permitir pero loguear warning
    console.warn('[EmailService] Redis no disponible, no se puede verificar rate limit');
    return { allowed: true, count: 0 };
  }

  const count = await redis.get(RATE_LIMIT_KEY);
  const current = count ? parseInt(count, 10) : 0;

  if (current >= DAILY_LIMIT) {
    return { allowed: false, count: current };
  }

  return { allowed: true, count: current };
}

/**
 * Incrementa el contador diario de envíos
 */
async function incrementDailyCount(): Promise<void> {
  if (!isRedisConnected()) return;

  const exists = await redis.exists(RATE_LIMIT_KEY);
  await redis.incr(RATE_LIMIT_KEY);

  if (!exists) {
    // Expira a medianoche: calcular segundos restantes del día
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const secondsRemaining = Math.ceil((endOfDay.getTime() - now.getTime()) / 1000);
    await redis.expire(RATE_LIMIT_KEY, secondsRemaining);
  }
}

/**
 * Registra error de rate limit en auditoría
 */
async function logRateLimitError(): Promise<void> {
  try {
    await AuditLog.create({
      userId: 0,
      action: 'email_rate_limit_reached',
      entity: 'email_service',
      entityId: 0,
      changes: { message: 'Se alcanzó el límite diario de correos electrónicos de Resend (3000/día)' },
      ipAddress: 'system',
      userAgent: 'email-service',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[EmailService] Error logging rate limit to audit:', err);
  }
}

/**
 * Registra error de envío en auditoría
 */
async function logSendError(error: any, to: string, subject: string): Promise<void> {
  try {
    await AuditLog.create({
      userId: 0,
      action: 'email_send_error',
      entity: 'email_service',
      entityId: 0,
      changes: {
        to,
        subject,
        errorCode: error?.statusCode || error?.code || 'unknown',
        errorMessage: error?.message || 'Error desconocido al enviar correo'
      },
      ipAddress: 'system',
      userAgent: 'email-service',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[EmailService] Error logging send error to audit:', err);
  }
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  success: boolean;
  data?: any;
  error?: string;
  rateLimited?: boolean;
}

/**
 * Envía un correo electrónico transaccional mediante Resend
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<SendEmailResult> {
  // Verificar rate limit
  const { allowed, count } = await checkRateLimit();

  if (!allowed) {
    await logRateLimitError();
    console.error(`[EmailService] Límite diario alcanzado (${count}/${DAILY_LIMIT})`);
    return {
      success: false,
      error: 'Se alcanzó el límite diario de correos electrónicos de Resend',
      rateLimited: true
    };
  }

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html
    });

    await incrementDailyCount();
    console.log(`[EmailService] ✅ Correo enviado exitosamente a ${to}`, JSON.stringify(response));
    return { success: true, data: response };
  } catch (error: any) {
    console.error('[EmailService] ❌ Error al enviar correo a', to, ':', JSON.stringify(error, null, 2));

    // Detectar error de rate limit de Resend (HTTP 429)
    if (error?.statusCode === 429) {
      await logRateLimitError();
      return {
        success: false,
        error: 'Se alcanzó el límite diario de correos electrónicos de Resend',
        rateLimited: true
      };
    }

    await logSendError(error, to, subject);
    return {
      success: false,
      error: error?.message || 'Error desconocido al enviar correo'
    };
  }
}
