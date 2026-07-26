/**
 * KYC Error Messages Dictionary
 * 
 * Maps error codes to user-friendly Spanish messages.
 * Avoids technical language and provides clear instructions for resolution.
 * 
 * Requirements: 30.9
 */

export interface ErrorMessage {
  title: string;
  message: string;
  instructions?: string[];
}

/**
 * Dictionary of KYC error messages in Spanish
 */
export const KYC_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Validation Errors (400)
  INVALID_IMAGE_RESOLUTION: {
    title: 'Resolución de imagen insuficiente',
    message: 'La foto capturada no tiene suficiente calidad. Necesitamos una imagen más clara.',
    instructions: [
      'Asegúrate de tener buena iluminación',
      'Acércate más al documento o cámara',
      'Limpia la lente de tu cámara',
      'Intenta capturar la imagen nuevamente',
    ],
  },
  INVALID_BRIGHTNESS: {
    title: 'Iluminación inadecuada',
    message: 'La imagen está muy oscura o muy brillante.',
    instructions: [
      'Busca un lugar con buena iluminación natural',
      'Evita luz directa que cause reflejos',
      'Ajusta la posición para mejorar la iluminación',
      'Intenta capturar la imagen nuevamente',
    ],
  },
  INVALID_DOCUMENT_FORMAT: {
    title: 'Formato de documento inválido',
    message: 'El documento proporcionado no es válido o no se puede leer.',
    instructions: [
      'Verifica que sea una cédula de identidad colombiana',
      'Asegúrate de que el documento esté completo en la imagen',
      'Evita reflejos o sombras sobre el documento',
      'Captura una nueva imagen del documento',
    ],
  },
  INVALID_DOCUMENT_NUMBER: {
    title: 'Número de cédula inválido',
    message: 'El número de cédula no tiene el formato correcto.',
    instructions: [
      'Verifica que tu cédula sea colombiana (CC) o de extranjería (CE)',
      'Asegúrate de que todos los números sean visibles',
      'Captura una imagen más clara del documento',
    ],
  },
  UNDERAGE_USER: {
    title: 'Edad mínima requerida',
    message: 'Debes tener al menos 18 años para usar esta plataforma.',
    instructions: [
      'Verifica que la fecha de nacimiento en tu documento sea correcta',
      'Si eres mayor de 18 años, contacta con soporte',
    ],
  },
  EXPIRED_DOCUMENT: {
    title: 'Documento vencido',
    message: 'Tu documento de identidad ha expirado.',
    instructions: [
      'Renueva tu documento de identidad',
      'Una vez renovado, inicia el proceso de verificación nuevamente',
      'Si crees que esto es un error, contacta con soporte',
    ],
  },

  // Authentication Errors (401)
  INVALID_TOKEN: {
    title: 'Sesión expirada',
    message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    instructions: [
      'Cierra esta ventana',
      'Inicia sesión en tu cuenta',
      'Intenta el proceso de verificación nuevamente',
    ],
  },
  UNAUTHENTICATED: {
    title: 'No autenticado',
    message: 'Necesitas iniciar sesión para continuar.',
    instructions: [
      'Inicia sesión en tu cuenta',
      'Regresa a esta página',
    ],
  },

  // Authorization Errors (403)
  INSUFFICIENT_VERIFICATION_LEVEL: {
    title: 'Verificación requerida',
    message: 'Necesitas completar más pasos de verificación para realizar esta acción.',
    instructions: [
      'Completa el proceso de verificación de identidad',
      'Una vez verificado, podrás realizar esta acción',
    ],
  },
  MAX_ATTEMPTS_EXCEEDED: {
    title: 'Límite de intentos alcanzado',
    message: 'Has alcanzado el número máximo de intentos de verificación.',
    instructions: [
      'Debes esperar 30 días para intentar nuevamente',
      'Si necesitas ayuda, contacta con soporte técnico',
    ],
  },
  UNAUTHORIZED: {
    title: 'Acceso no autorizado',
    message: 'No tienes permisos para realizar esta acción.',
    instructions: [
      'Verifica que estés usando la cuenta correcta',
      'Si crees que esto es un error, contacta con soporte',
    ],
  },

  // Not Found Errors (404)
  VERIFICATION_NOT_FOUND: {
    title: 'Verificación no encontrada',
    message: 'No se encontró tu proceso de verificación.',
    instructions: [
      'Inicia un nuevo proceso de verificación',
      'Si el problema persiste, contacta con soporte',
    ],
  },
  DOCUMENT_NOT_FOUND: {
    title: 'Documento no encontrado',
    message: 'No se encontró el documento solicitado.',
    instructions: [
      'Intenta cargar el documento nuevamente',
      'Si el problema persiste, contacta con soporte',
    ],
  },

  // Processing Errors (422)
  OCR_EXTRACTION_FAILED: {
    title: 'No se pudo leer el documento',
    message: 'No pudimos extraer la información de tu documento.',
    instructions: [
      'Asegúrate de que el documento esté bien iluminado',
      'Verifica que todo el texto sea legible',
      'Evita reflejos o sombras',
      'Captura una nueva imagen más clara',
    ],
  },
  NO_FACE_DETECTED: {
    title: 'No se detectó un rostro',
    message: 'No pudimos detectar tu rostro en la imagen.',
    instructions: [
      'Asegúrate de estar mirando directamente a la cámara',
      'Retira gafas de sol, gorras o accesorios que cubran tu rostro',
      'Mejora la iluminación',
      'Intenta capturar la selfie nuevamente',
    ],
  },
  MULTIPLE_FACES_DETECTED: {
    title: 'Múltiples rostros detectados',
    message: 'Se detectaron varias personas en la imagen.',
    instructions: [
      'Asegúrate de estar solo en la imagen',
      'Verifica que no haya personas en el fondo',
      'Captura una nueva selfie',
    ],
  },
  FACE_MATCH_FAILED: {
    title: 'Los rostros no coinciden',
    message: 'El rostro en tu selfie no coincide con el del documento.',
    instructions: [
      'Asegúrate de usar tu propio documento',
      'Verifica que la iluminación sea buena en ambas fotos',
      'Retira gafas o accesorios que dificulten la comparación',
      'Intenta capturar las imágenes nuevamente',
    ],
  },
  LIVENESS_DETECTION_FAILED: {
    title: 'Detección de vida fallida',
    message: 'No pudimos verificar que eres una persona real.',
    instructions: [
      'Asegúrate de realizar todos los gestos solicitados',
      'Mantén tu rostro visible durante todo el video',
      'Mejora la iluminación',
      'Graba el video nuevamente',
    ],
  },
  VIDEO_PROCESSING_FAILED: {
    title: 'Error al procesar el video',
    message: 'No pudimos procesar tu video de verificación.',
    instructions: [
      'Verifica que tu cámara funcione correctamente',
      'Asegúrate de tener buena conexión a internet',
      'Intenta grabar el video nuevamente',
    ],
  },

  // Network Errors
  NETWORK_ERROR: {
    title: 'Error de conexión',
    message: 'No pudimos conectar con el servidor. Verifica tu conexión a internet.',
    instructions: [
      'Verifica tu conexión a internet',
      'Intenta nuevamente en unos momentos',
      'Si el problema persiste, contacta con soporte',
    ],
  },
  UPLOAD_FAILED: {
    title: 'Error al subir archivo',
    message: 'No pudimos subir tu documento. Intenta nuevamente.',
    instructions: [
      'Verifica tu conexión a internet',
      'Asegúrate de que el archivo no sea muy grande',
      'Intenta subir el archivo nuevamente',
    ],
  },
  TIMEOUT_ERROR: {
    title: 'Tiempo de espera agotado',
    message: 'La operación tardó demasiado tiempo.',
    instructions: [
      'Verifica tu conexión a internet',
      'Intenta nuevamente',
      'Si el problema persiste, contacta con soporte',
    ],
  },

  // Camera/Permission Errors
  CAMERA_PERMISSION_DENIED: {
    title: 'Permisos de cámara denegados',
    message: 'Necesitamos acceso a tu cámara para capturar las imágenes.',
    instructions: [
      'Haz clic en el icono de cámara en la barra de direcciones',
      'Selecciona "Permitir" para dar acceso a la cámara',
      'Recarga la página',
      'Si usas un navegador móvil, verifica los permisos en la configuración',
    ],
  },
  CAMERA_NOT_FOUND: {
    title: 'Cámara no encontrada',
    message: 'No se detectó ninguna cámara en tu dispositivo.',
    instructions: [
      'Verifica que tu dispositivo tenga una cámara',
      'Asegúrate de que la cámara esté conectada correctamente',
      'Intenta usar otro dispositivo',
    ],
  },
  CAMERA_ERROR: {
    title: 'Error de cámara',
    message: 'Ocurrió un error al acceder a tu cámara.',
    instructions: [
      'Cierra otras aplicaciones que puedan estar usando la cámara',
      'Recarga la página',
      'Intenta usar otro navegador',
      'Si el problema persiste, reinicia tu dispositivo',
    ],
  },

  // Internal Errors (500)
  INTERNAL_SERVER_ERROR: {
    title: 'Error del servidor',
    message: 'Ocurrió un error en nuestros servidores. Estamos trabajando para solucionarlo.',
    instructions: [
      'Intenta nuevamente en unos minutos',
      'Si el problema persiste, contacta con soporte',
    ],
  },
  ENCRYPTION_ERROR: {
    title: 'Error de seguridad',
    message: 'Ocurrió un error al procesar tu información de forma segura.',
    instructions: [
      'Intenta nuevamente',
      'Si el problema persiste, contacta con soporte técnico',
    ],
  },
  STORAGE_ERROR: {
    title: 'Error de almacenamiento',
    message: 'No pudimos guardar tu información.',
    instructions: [
      'Intenta nuevamente',
      'Si el problema persiste, contacta con soporte',
    ],
  },

  // Generic/Unknown Error
  UNKNOWN_ERROR: {
    title: 'Error desconocido',
    message: 'Ocurrió un error inesperado.',
    instructions: [
      'Intenta nuevamente',
      'Recarga la página',
      'Si el problema persiste, contacta con soporte técnico',
    ],
  },
  RESUBMISSION_REQUIRED: {
    title: 'Reenvío de documentos requerido',
    message: 'Algunos documentos no pudieron ser procesados correctamente.',
    instructions: [
      'Asegúrate de que todas las fotos sean claras y legibles',
      'Verifica que el rostro sea visible en todas las selfies',
      'Usa un fondo neutro y buena iluminación',
      'Haz clic en "Reiniciar Proceso" para intentar de nuevo',
    ],
  },
};

/**
 * Gets a user-friendly error message for a given error code
 * 
 * @param errorCode - Error code from the API
 * @returns ErrorMessage object with title, message, and instructions
 */
export function getErrorMessage(errorCode: string): ErrorMessage {
  return KYC_ERROR_MESSAGES[errorCode] || KYC_ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Extracts error code from an error object or message
 * 
 * @param error - Error object or message
 * @returns Error code string
 */
export function extractErrorCode(error: Error | string): string {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Try to extract error code from message (format: "ERROR_CODE: message")
  const match = errorMessage.match(/^([A-Z_]+):/);
  if (match) {
    return match[1];
  }

  // Check if the message itself is a known error code
  if (KYC_ERROR_MESSAGES[errorMessage]) {
    return errorMessage;
  }

  const lower = errorMessage.toLowerCase();

  // Map common error patterns to error codes
  if (lower.includes('resolution') || lower.includes('resolución')) {
    return 'INVALID_IMAGE_RESOLUTION';
  }
  if (lower.includes('brightness') || lower.includes('brillo')) {
    return 'INVALID_BRIGHTNESS';
  }
  if (lower.includes('face') || lower.includes('rostro')) {
    return 'NO_FACE_DETECTED';
  }
  if (lower.includes('network') || lower.includes('red')) {
    return 'NETWORK_ERROR';
  }
  if (lower.includes('camera') || lower.includes('cámara')) {
    return 'CAMERA_ERROR';
  }
  if (lower.includes('permission') || lower.includes('permiso')) {
    return 'CAMERA_PERMISSION_DENIED';
  }
  if (lower.includes('upload') || lower.includes('subir')) {
    return 'UPLOAD_FAILED';
  }
  if (lower.includes('timeout') || lower.includes('tiempo')) {
    return 'TIMEOUT_ERROR';
  }
  if (lower.includes('resubmission_required')) {
    return 'RESUBMISSION_REQUIRED';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Formats an error for display to the user
 * 
 * @param error - Error object or message
 * @returns Formatted error message
 */
export function formatErrorForUser(error: Error | string): ErrorMessage {
  const errorCode = extractErrorCode(error);
  return getErrorMessage(errorCode);
}
