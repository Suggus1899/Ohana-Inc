/**
 * Configuración de umbrales para detección de liveness
 * Todos los valores pueden ser configurados mediante variables de entorno
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

export interface LivenessConfig {
  // Umbrales de Eye Aspect Ratio (EAR)
  BLINK_EAR_THRESHOLD: number;
  MIN_BLINKS_REQUIRED: number;
  
  // Umbrales de movimiento de cabeza
  HEAD_MOVEMENT_THRESHOLD: number;
  SIGNIFICANT_MOVEMENT_THRESHOLD: number;
  
  // Umbrales de calidad de frames
  MIN_BRIGHTNESS: number;
  MAX_BRIGHTNESS: number;
  SHARPNESS_THRESHOLD: number;
  FACE_CONFIDENCE_THRESHOLD: number;
  
  // Umbrales de comparación facial
  FACE_MATCH_THRESHOLD: number;
  
  // Configuración de frames
  LIVENESS_FRAME_COUNT: number;
  MIN_VALID_FRAME_RATE: number;
}

/**
 * Obtiene la configuración de liveness desde variables de entorno
 * con valores por defecto si no están definidas
 */
function getConfig(): LivenessConfig {
  return {
    // Umbrales de EAR (Requirement 12.1, 12.2)
    BLINK_EAR_THRESHOLD: parseFloat(process.env.BLINK_EAR_THRESHOLD || '0.2'),
    MIN_BLINKS_REQUIRED: parseInt(process.env.MIN_BLINKS_REQUIRED || '2', 10),
    
    // Umbrales de movimiento de cabeza
    HEAD_MOVEMENT_THRESHOLD: parseFloat(process.env.HEAD_MOVEMENT_THRESHOLD || '15'),
    SIGNIFICANT_MOVEMENT_THRESHOLD: parseFloat(process.env.SIGNIFICANT_MOVEMENT_THRESHOLD || '5'),
    
    // Umbrales de calidad (Requirement 12.4, 12.5)
    MIN_BRIGHTNESS: parseFloat(process.env.MIN_BRIGHTNESS || '50'),
    MAX_BRIGHTNESS: parseFloat(process.env.MAX_BRIGHTNESS || '200'),
    SHARPNESS_THRESHOLD: parseFloat(process.env.SHARPNESS_THRESHOLD || '100'),
    FACE_CONFIDENCE_THRESHOLD: parseFloat(process.env.FACE_CONFIDENCE_THRESHOLD || '92'),
    
    // Umbrales de comparación facial (Requirement 12.3)
    FACE_MATCH_THRESHOLD: parseFloat(process.env.FACE_MATCH_THRESHOLD || '80'),
    
    // Configuración de frames
    LIVENESS_FRAME_COUNT: parseInt(process.env.LIVENESS_FRAME_COUNT || '30', 10),
    MIN_VALID_FRAME_RATE: parseFloat(process.env.MIN_VALID_FRAME_RATE || '0.8')
  };
}

// Exportar configuración como constante
export const livenessConfig: LivenessConfig = getConfig();

/**
 * Valida que la configuración tenga valores válidos
 * @throws Error si algún valor es inválido
 */
export function validateConfig(config: LivenessConfig): void {
  const errors: string[] = [];

  // Validar EAR threshold (debe estar entre 0 y 1)
  if (config.BLINK_EAR_THRESHOLD < 0 || config.BLINK_EAR_THRESHOLD > 1) {
    errors.push('BLINK_EAR_THRESHOLD must be between 0 and 1');
  }

  // Validar mínimo de parpadeos (debe ser >= 1)
  if (config.MIN_BLINKS_REQUIRED < 1) {
    errors.push('MIN_BLINKS_REQUIRED must be >= 1');
  }

  // Validar umbrales de movimiento (deben ser positivos)
  if (config.HEAD_MOVEMENT_THRESHOLD <= 0) {
    errors.push('HEAD_MOVEMENT_THRESHOLD must be > 0');
  }
  if (config.SIGNIFICANT_MOVEMENT_THRESHOLD <= 0) {
    errors.push('SIGNIFICANT_MOVEMENT_THRESHOLD must be > 0');
  }

  // Validar brillo (debe estar en rango 0-255)
  if (config.MIN_BRIGHTNESS < 0 || config.MIN_BRIGHTNESS > 255) {
    errors.push('MIN_BRIGHTNESS must be between 0 and 255');
  }
  if (config.MAX_BRIGHTNESS < 0 || config.MAX_BRIGHTNESS > 255) {
    errors.push('MAX_BRIGHTNESS must be between 0 and 255');
  }
  if (config.MIN_BRIGHTNESS >= config.MAX_BRIGHTNESS) {
    errors.push('MIN_BRIGHTNESS must be < MAX_BRIGHTNESS');
  }

  // Validar nitidez (debe ser positiva)
  if (config.SHARPNESS_THRESHOLD <= 0) {
    errors.push('SHARPNESS_THRESHOLD must be > 0');
  }

  // Validar confianza facial (debe estar entre 0 y 100)
  if (config.FACE_CONFIDENCE_THRESHOLD < 0 || config.FACE_CONFIDENCE_THRESHOLD > 100) {
    errors.push('FACE_CONFIDENCE_THRESHOLD must be between 0 and 100');
  }

  // Validar umbral de match facial (debe estar entre 0 y 100)
  if (config.FACE_MATCH_THRESHOLD < 0 || config.FACE_MATCH_THRESHOLD > 100) {
    errors.push('FACE_MATCH_THRESHOLD must be between 0 and 100');
  }

  // Validar conteo de frames (debe ser >= 20)
  if (config.LIVENESS_FRAME_COUNT < 20) {
    errors.push('LIVENESS_FRAME_COUNT must be >= 20');
  }

  // Validar tasa de frames válidos (debe estar entre 0 y 1)
  if (config.MIN_VALID_FRAME_RATE < 0 || config.MIN_VALID_FRAME_RATE > 1) {
    errors.push('MIN_VALID_FRAME_RATE must be between 0 and 1');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid liveness configuration:\n${errors.join('\n')}`);
  }
}

// Validar configuración al cargar el módulo
validateConfig(livenessConfig);

// Log de configuración en desarrollo
if (process.env.NODE_ENV !== 'production') {
  console.log('📋 Liveness Configuration:', {
    BLINK_EAR_THRESHOLD: livenessConfig.BLINK_EAR_THRESHOLD,
    MIN_BLINKS_REQUIRED: livenessConfig.MIN_BLINKS_REQUIRED,
    HEAD_MOVEMENT_THRESHOLD: livenessConfig.HEAD_MOVEMENT_THRESHOLD,
    FACE_CONFIDENCE_THRESHOLD: livenessConfig.FACE_CONFIDENCE_THRESHOLD,
    FACE_MATCH_THRESHOLD: livenessConfig.FACE_MATCH_THRESHOLD,
    LIVENESS_FRAME_COUNT: livenessConfig.LIVENESS_FRAME_COUNT
  });
}
