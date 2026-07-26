import { Op } from 'sequelize';
import cron from 'node-cron';
import KYCVerification from '../models/KYCVerification';
import KYCDocument from '../models/KYCDocument';
import { NotificationService } from '../services/notification.service';
import { StorageService } from '../services/storage.service';
import alertService from '../services/alert.service';
import { KYCService } from '../services/kyc.service';

/**
 * Job para eliminar documentos antiguos (más de 90 días después de aprobación)
 * Requisito 25: Retención y Eliminación de Datos
 */
export async function deleteOldDocuments(): Promise<void> {
  try {
    console.log('[KYC Jobs] Iniciando eliminación de documentos antiguos...');

    const now = new Date();
    const retentionDate = new Date(now);
    retentionDate.setDate(retentionDate.getDate() - 90);

    // Buscar verificaciones aprobadas hace más de 90 días que tengan URLs de documentos
    const oldVerifications = await KYCVerification.findAll({
      where: {
        status: 'approved',
        verifiedAt: {
          [Op.lte]: retentionDate
        }
      }
    });

    // Filtrar solo las que tienen al menos una URL
    const verificationsWithDocuments = oldVerifications.filter(v => 
      v.documentFrontUrl || v.documentBackUrl || v.selfieUrl || 
      v.selfieWithDocumentUrl || v.livenessVideoUrl || v.proofOfAddressUrl
    );

    console.log(`[KYC Jobs] Encontradas ${verificationsWithDocuments.length} verificaciones con documentos antiguos`);

    const storageService = new StorageService();

    for (const verification of verificationsWithDocuments) {
      try {
        // Obtener todos los documentos asociados
        const documents = await KYCDocument.findAll({
          where: { verificationId: verification.id }
        });

        // Eliminar archivos físicos del almacenamiento
        for (const doc of documents) {
          try {
            const path = doc.encryptedUrl.replace(/^https?:\/\/[^/]+\//, '');
            const exists = await storageService.exists(path);
            if (exists) {
              await storageService.delete(path);
              console.log(`[KYC Jobs] Eliminado archivo: ${path}`);
            }
          } catch (error) {
            console.error(`[KYC Jobs] Error eliminando archivo ${doc.encryptedUrl}:`, error);
          }
        }

        // Establecer URLs a null en la verificación
        await verification.update({
          documentFrontUrl: null as any,
          documentBackUrl: null as any,
          selfieUrl: null as any,
          selfieWithDocumentUrl: null as any,
          livenessVideoUrl: null as any,
          proofOfAddressUrl: null as any
        });

        console.log(`[KYC Jobs] Documentos eliminados para verificación ${verification.id}`);
      } catch (error) {
        console.error(`[KYC Jobs] Error procesando verificación ${verification.id}:`, error);
      }
    }

    console.log('[KYC Jobs] Eliminación de documentos antiguos completada');
  } catch (error) {
    console.error('[KYC Jobs] Error en deleteOldDocuments:', error);
    throw error;
  }
}

/**
 * Job para enviar recordatorios de expiración
 * Requisito 24.9-24.10: Enviar recordatorios 30 y 7 días antes de expiración
 */
export async function sendExpirationReminders(): Promise<void> {
  try {
    console.log('[KYC Jobs] Iniciando envío de recordatorios de expiración...');

    const now = new Date();
    const notificationService = new NotificationService();

    // Buscar verificaciones que expiran en 30 días
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStart = new Date(in30Days);
    in30DaysStart.setHours(0, 0, 0, 0);
    const in30DaysEnd = new Date(in30Days);
    in30DaysEnd.setHours(23, 59, 59, 999);

    const expiring30Days = await KYCVerification.findAll({
      where: {
        status: 'approved',
        expiresAt: {
          [Op.between]: [in30DaysStart, in30DaysEnd]
        }
      }
    });

    console.log(`[KYC Jobs] Encontradas ${expiring30Days.length} verificaciones expirando en 30 días`);

    // Enviar recordatorios para 30 días
    for (const verification of expiring30Days) {
      try {
        await notificationService.sendExpirationReminderEmail(verification.userId, 30);
        console.log(`[KYC Jobs] Recordatorio de 30 días enviado a usuario ${verification.userId}`);
      } catch (error) {
        console.error(`[KYC Jobs] Error enviando recordatorio a usuario ${verification.userId}:`, error);
      }
    }

    // Buscar verificaciones que expiran en 7 días
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStart = new Date(in7Days);
    in7DaysStart.setHours(0, 0, 0, 0);
    const in7DaysEnd = new Date(in7Days);
    in7DaysEnd.setHours(23, 59, 59, 999);

    const expiring7Days = await KYCVerification.findAll({
      where: {
        status: 'approved',
        expiresAt: {
          [Op.between]: [in7DaysStart, in7DaysEnd]
        }
      }
    });

    console.log(`[KYC Jobs] Encontradas ${expiring7Days.length} verificaciones expirando en 7 días`);

    // Enviar recordatorios para 7 días
    for (const verification of expiring7Days) {
      try {
        await notificationService.sendExpirationReminderEmail(verification.userId, 7);
        console.log(`[KYC Jobs] Recordatorio de 7 días enviado a usuario ${verification.userId}`);
      } catch (error) {
        console.error(`[KYC Jobs] Error enviando recordatorio a usuario ${verification.userId}:`, error);
      }
    }

    console.log('[KYC Jobs] Envío de recordatorios de expiración completado');
  } catch (error) {
    console.error('[KYC Jobs] Error en sendExpirationReminders:', error);
    throw error;
  }
}

/**
 * Job para verificar condiciones de alerta y enviar notificaciones
 * Requisitos 33.12-33.13: Alertas de cola de revisión y tasa de rechazo
 */
export async function checkAndSendAlerts(): Promise<void> {
  try {
    console.log('[KYC Jobs] Iniciando verificación de alertas...');

    await alertService.checkAndSendAlerts();

    console.log('[KYC Jobs] Verificación de alertas completada');
  } catch (error) {
    console.error('[KYC Jobs] Error en checkAndSendAlerts:', error);
    throw error;
  }
}

/**
 * Job para verificar verificaciones expiradas
 * Requisito 24: Expiración y Renovación de Verificaciones
 */
export async function checkExpiredVerifications(): Promise<void> {
  try {
    console.log('[KYC Jobs] Iniciando verificación de verificaciones expiradas...');

    const kycService = new KYCService();
    await kycService.checkExpiredVerifications();

    console.log('[KYC Jobs] Verificación de verificaciones expiradas completada');
  } catch (error) {
    console.error('[KYC Jobs] Error en checkExpiredVerifications:', error);
    throw error;
  }
}

/**
 * Programa el job de verificación de verificaciones expiradas
 * Se ejecuta diariamente a las 2:00 AM
 */
function scheduleExpiredVerificationsCheck(): void {
  cron.schedule('0 2 * * *', async () => {
    console.log('[KYC Jobs] Ejecutando job programado: checkExpiredVerifications');
    try {
      await checkExpiredVerifications();
    } catch (error) {
      console.error('[KYC Jobs] Error en job programado checkExpiredVerifications:', error);
    }
  });
  console.log('[KYC Jobs] ✓ Job programado: checkExpiredVerifications (diario a las 2:00 AM)');
}

/**
 * Programa el job de eliminación de documentos antiguos
 * Se ejecuta diariamente a las 3:00 AM
 */
function scheduleOldDocumentsDeletion(): void {
  cron.schedule('0 3 * * *', async () => {
    console.log('[KYC Jobs] Ejecutando job programado: deleteOldDocuments');
    try {
      await deleteOldDocuments();
    } catch (error) {
      console.error('[KYC Jobs] Error en job programado deleteOldDocuments:', error);
    }
  });
  console.log('[KYC Jobs] ✓ Job programado: deleteOldDocuments (diario a las 3:00 AM)');
}

/**
 * Programa el job de envío de recordatorios de expiración
 * Se ejecuta diariamente a las 10:00 AM
 */
function scheduleExpirationReminders(): void {
  cron.schedule('0 10 * * *', async () => {
    console.log('[KYC Jobs] Ejecutando job programado: sendExpirationReminders');
    try {
      await sendExpirationReminders();
    } catch (error) {
      console.error('[KYC Jobs] Error en job programado sendExpirationReminders:', error);
    }
  });
  console.log('[KYC Jobs] ✓ Job programado: sendExpirationReminders (diario a las 10:00 AM)');
}

/**
 * Programa el job de verificación y envío de alertas
 * Se ejecuta cada hora
 * 
 * Requisitos 33.12-33.13: Alertas de cola de revisión y tasa de rechazo
 */
function scheduleAlerts(): void {
  cron.schedule('0 * * * *', async () => {
    console.log('[KYC Jobs] Ejecutando job programado: checkAndSendAlerts');
    try {
      await checkAndSendAlerts();
    } catch (error) {
      console.error('[KYC Jobs] Error en job programado checkAndSendAlerts:', error);
    }
  });
  console.log('[KYC Jobs] ✓ Job programado: checkAndSendAlerts (cada hora)');
}

/**
 * Inicializa todos los jobs programados del sistema KYC
 * Esta función debe ser llamada al iniciar el servidor
 */
export function initializeKYCJobs(): void {
  console.log('[KYC Jobs] Inicializando jobs programados del sistema KYC...');
  
  scheduleExpiredVerificationsCheck();
  // scheduleOldDocumentsDeletion(); // Deshabilitado: eliminación automática de documentos
  scheduleExpirationReminders();
  scheduleAlerts();
  
  console.log('[KYC Jobs] ✓ Todos los jobs programados han sido inicializados correctamente');
}
