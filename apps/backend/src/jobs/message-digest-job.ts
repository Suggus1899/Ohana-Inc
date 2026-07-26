import cron from 'node-cron';
import { redis, isRedisConnected } from '../config/redis';
import { User } from '../models';
import { sendEmail } from '../services/email.service';
import { unreadMessagesDigestTemplate } from '../services/email-templates';

/**
 * Job: Digest diario de mensajes sin leer
 * Se ejecuta todos los días a las 6:00 PM hora de Colombia (UTC-5 = 23:00 UTC)
 * 
 * Lógica:
 * - Busca en Redis todas las keys `msg_digest:{userId}` que contienen sets de senderIds
 * - Para cada usuario con mensajes pendientes, obtiene los nombres de los remitentes
 * - Envía UN solo correo con la lista de personas que le escribieron
 * - Limpia las keys de Redis después de enviar
 * 
 * Si el usuario se conectó durante el día, su key ya fue eliminada por socket.ts
 */
async function processMessageDigest(): Promise<void> {
  if (!isRedisConnected()) {
    console.log('[MessageDigest] Redis no disponible, saltando digest');
    return;
  }

  console.log('[MessageDigest] Iniciando procesamiento de digest diario...');

  try {
    // Buscar todas las keys de digest pendientes
    const keys = await redis.keys('msg_digest:*');

    if (keys.length === 0) {
      console.log('[MessageDigest] No hay mensajes pendientes para notificar');
      return;
    }

    console.log(`[MessageDigest] ${keys.length} usuario(s) con mensajes pendientes`);

    let emailsSent = 0;

    for (const key of keys) {
      try {
        const userId = parseInt(key.replace('msg_digest:', ''), 10);
        if (isNaN(userId)) continue;

        // Obtener IDs de remitentes
        const senderIds = await redis.smembers(key);
        if (!senderIds || senderIds.length === 0) {
          await redis.del(key);
          continue;
        }

        // Obtener datos del destinatario
        const recipient = await User.findByPk(userId, { attributes: ['id', 'name', 'email'] });
        if (!recipient) {
          await redis.del(key);
          continue;
        }

        // Obtener nombres de los remitentes
        const senders = await User.findAll({
          where: { id: senderIds.map(Number) },
          attributes: ['name']
        });
        const senderNames = senders.map(s => s.name);

        if (senderNames.length === 0) {
          await redis.del(key);
          continue;
        }

        // Enviar digest
        const result = await sendEmail({
          to: recipient.email,
          subject: senderNames.length === 1
            ? `${senderNames[0]} te envió un mensaje`
            : `Tienes ${senderNames.length} mensajes sin leer`,
          html: unreadMessagesDigestTemplate(recipient.name, senderNames)
        });

        if (result.success) {
          emailsSent++;
        }

        // Limpiar la key independientemente del resultado
        await redis.del(key);
      } catch (err) {
        console.error(`[MessageDigest] Error procesando key ${key}:`, err);
        // Limpiar key corrupta
        await redis.del(key).catch(() => {});
      }
    }

    console.log(`[MessageDigest] Digest completado: ${emailsSent} correo(s) enviado(s)`);
  } catch (error) {
    console.error('[MessageDigest] Error general:', error);
  }
}

/**
 * Inicializar el job de digest de mensajes
 * Cron: "0 23 * * *" = todos los días a las 23:00 UTC = 6:00 PM Colombia (UTC-5)
 */
export function initMessageDigestJob(): void {
  cron.schedule('0 23 * * *', () => {
    console.log('[MessageDigest] Ejecutando digest diario (6:00 PM CO)...');
    processMessageDigest();
  });

  console.log('✅ Message digest job initialized (daily at 6:00 PM CO / 23:00 UTC)');
}
