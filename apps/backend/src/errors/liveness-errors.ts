/**
 * Custom error classes for liveness detection system
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

/**
 * Base class for all liveness-related errors
 */
export class LivenessError extends Error {
  public code: string;
  public statusCode: number;
  public details?: Record<string, any>;
  public isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 422,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'LivenessError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when quality checks fail
 * Requirements: 10.2 (POOR_QUALITY)
 */
export class QualityError extends LivenessError {
  constructor(
    message: string = 'La calidad del video es insuficiente. Por favor, graba en un lugar bien iluminado.',
    details?: Record<string, any>
  ) {
    super(message, 'POOR_QUALITY', 422, details);
    this.name = 'QualityError';
  }
}

/**
 * Error thrown when processing operations fail
 * Requirements: 10.3 (VIDEO_PROCESSING_FAILED, FACE_DETECTION_FAILED, OCR_EXTRACTION_FAILED)
 */
export class LivenessProcessingError extends LivenessError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>
  ) {
    super(message, code, 422, details);
    this.name = 'LivenessProcessingError';
  }

  static videoProcessing(details?: Record<string, any>): LivenessProcessingError {
    return new LivenessProcessingError(
      'Hubo un error al procesar tu video. Por favor, intenta nuevamente.',
      'VIDEO_PROCESSING_FAILED',
      details
    );
  }

  static faceDetection(details?: Record<string, any>): LivenessProcessingError {
    return new LivenessProcessingError(
      'Hubo un error al analizar tu rostro. Por favor, intenta nuevamente.',
      'FACE_DETECTION_FAILED',
      details
    );
  }

  static ocrExtraction(details?: Record<string, any>): LivenessProcessingError {
    return new LivenessProcessingError(
      'No pudimos leer tu documento. Por favor, asegúrate de que la imagen sea clara y legible.',
      'OCR_EXTRACTION_FAILED',
      details
    );
  }
}

/**
 * Error thrown when dependency validation fails
 * Requirements: 10.1 (FFMPEG_NOT_FOUND, MODELS_NOT_FOUND, OCR_INITIALIZATION_FAILED)
 */
export class DependencyError extends LivenessError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>
  ) {
    super(message, code, 500, details);
    this.name = 'DependencyError';
  }

  static ffmpegNotFound(): DependencyError {
    return new DependencyError(
      'Sistema temporalmente no disponible',
      'FFMPEG_NOT_FOUND',
      { technical: 'ffmpeg is not installed or not in PATH' }
    );
  }

  static modelsNotFound(): DependencyError {
    return new DependencyError(
      'Sistema temporalmente no disponible',
      'MODELS_NOT_FOUND',
      { technical: 'face-api.js models not found in models/face-api/' }
    );
  }

  static ocrInitializationFailed(error?: Error): DependencyError {
    return new DependencyError(
      'No pudimos procesar tu documento. Por favor, intenta nuevamente.',
      'OCR_INITIALIZATION_FAILED',
      { technical: error?.message }
    );
  }
}

/**
 * Error thrown when validation checks fail
 * Requirements: 10.2 (LIVENESS_FAILED, INSUFFICIENT_FRAMES, UNDERAGE, FACE_NOT_DETECTED, FACE_MISMATCH)
 */
export class LivenessValidationError extends LivenessError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>
  ) {
    super(message, code, 422, details);
    this.name = 'LivenessValidationError';
  }

  static livenessFailed(blinkCount: number, details?: Record<string, any>): LivenessValidationError {
    return new LivenessValidationError(
      'No pudimos verificar que eres una persona real. Por favor, graba un nuevo video parpadeando naturalmente.',
      'LIVENESS_FAILED',
      { blinkCount, ...details }
    );
  }

  static insufficientFrames(framesExtracted: number): LivenessValidationError {
    return new LivenessValidationError(
      'El video es muy corto o está corrupto. Por favor, graba un video de al menos 3 segundos.',
      'INSUFFICIENT_FRAMES',
      { framesExtracted, minimumRequired: 20 }
    );
  }

  static underage(age: number): LivenessValidationError {
    return new LivenessValidationError(
      'Debes ser mayor de 18 años para usar este servicio.',
      'UNDERAGE',
      { age, minimumRequired: 18 }
    );
  }

  static faceNotDetected(context: string): LivenessValidationError {
    return new LivenessValidationError(
      'No pudimos detectar tu rostro. Por favor, asegúrate de que tu cara esté visible y bien iluminada.',
      'FACE_NOT_DETECTED',
      { context }
    );
  }

  static faceMismatch(similarity: number): LivenessValidationError {
    return new LivenessValidationError(
      'El rostro en el video no coincide con el documento. Por favor, verifica que estés usando tu propio documento.',
      'FACE_MISMATCH',
      { similarity, threshold: 80 }
    );
  }
}
