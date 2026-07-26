/**
 * Centralized UI message constants.
 *
 * Use these instead of inline string literals in toast() calls and error
 * handlers. Keeps copy consistent across the app and prepares for i18n.
 */

export const TOAST_TITLES = {
  ERROR: 'Error',
  SUCCESS: 'Éxito',
  WARNING: 'Atención',
  INFO: 'Información',
  REQUIRED: 'Requerido',
} as const;

export const ERROR_MESSAGES = {
  // Generic
  UNKNOWN: 'Error desconocido',
  SERVER: 'Error de servidor',
  LOAD_DATA: 'No se pudieron cargar los datos',
  LOAD_TRANSACTIONS: 'No se pudieron cargar las transacciones',
  LOAD_DISPUTES: 'No se pudieron cargar las disputas',

  // Auth / session
  SESSION_EXPIRED: 'Sesión expirada',
  CHAT_START: 'Error al iniciar chat',
  OWNER_NOT_FOUND: 'No se encontró el propietario',

  // Validation
  PAYMENT_METHOD_REQUIRED: 'Selecciona un método de pago',
  PAYMENT_REFERENCE_REQUIRED: 'Ingresa la referencia de pago',
  MAX_FILES_EXCEEDED: 'Máximo 5 archivos permitidos',
  AMOUNT_MUST_BE_POSITIVE: 'El monto debe ser mayor a 0',
  DISPUTE_REASON_REQUIRED: 'Selecciona un motivo',
  DISPUTE_DESCRIPTION_TOO_SHORT: 'La descripción debe tener al menos 20 caracteres',
  RESOLUTION_NOTES_REQUIRED: 'Debes agregar notas de resolución',

  // Reports
  REPORT_SEND_FAILED: 'No se pudo enviar el reporte',
} as const;

export const SUCCESS_MESSAGES = {
  // Generic
  SAVED: 'Cambios guardados correctamente',
  DELETED: 'Eliminado correctamente',

  // Transactions
  TRANSACTION_APPROVED: 'Transacción aprobada',
  TRANSACTION_REJECTED: 'Transacción rechazada',
  TRANSACTION_CANCELLED: 'Transacción cancelada',
  PAYMENT_SUBMITTED: 'Pago enviado correctamente',
  PAYMENT_CONFIRMED: 'Pago confirmado',

  // Disputes
  DISPUTE_CREATED: 'Disputa creada correctamente',
  DISPUTE_RESOLVED: 'Disputa resuelta',

  // Content review
  PROPERTY_APPROVED: 'Propiedad aprobada',
  PROPERTY_REJECTED: 'Propiedad rechazada',
} as const;

/**
 * Helper builders for common toast shapes.
 * Usage: toast(ERROR_TOAST(ERROR_MESSAGES.LOAD_DATA))
 */
export const ERROR_TOAST = (description: string) => ({
  title: TOAST_TITLES.ERROR,
  description,
  variant: 'destructive' as const,
});

export const SUCCESS_TOAST = (description: string) => ({
  title: TOAST_TITLES.SUCCESS,
  description,
});

export const REQUIRED_TOAST = (description: string) => ({
  title: TOAST_TITLES.REQUIRED,
  description,
  variant: 'destructive' as const,
});
