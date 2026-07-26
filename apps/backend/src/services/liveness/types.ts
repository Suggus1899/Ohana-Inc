/**
 * Tipos compartidos para servicios de liveness detection
 */

import * as faceapi from '@vladmandic/face-api';

/**
 * Punto 2D en el espacio
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Frame de video con landmarks faciales detectados
 */
export interface FrameWithLandmarks {
  frameIndex: number;
  landmarks: faceapi.FaceLandmarks68;
  timestamp: number;
  faceConfidence: number;
}

/**
 * Resultado de detección de parpadeos
 */
export interface BlinkResult {
  blinkCount: number;
  blinkTimestamps: number[];
  averageEAR: number;
  earSequence: number[]; // EAR por frame para debugging
}

/**
 * Resultado de validación de movimiento de cabeza
 */
export interface MovementResult {
  isNatural: boolean;
  angleRange: number; // max - min
  maxAngle: number;
  minAngle: number;
  significantMovements: number; // cambios > 5 grados
  angleSequence: number[]; // ángulos por frame para debugging
}

/**
 * Métricas de calidad de un frame
 */
export interface FrameQuality {
  brightness: number; // 0-255
  sharpness: number; // Laplacian variance
  faceConfidence: number; // 0-100
  meetsThresholds: boolean;
}

/**
 * Métricas de performance del análisis de liveness
 */
export interface LivenessPerformance {
  totalProcessingTime: number; // En milisegundos
  frameExtractionTime: number; // En milisegundos
  blinkDetectionTime: number; // En milisegundos
  qualityAnalysisTime: number; // En milisegundos
  memoryUsageMB: number; // En MB
}

/**
 * Resultado completo de análisis de liveness
 */
export interface LivenessResult {
  isLive: boolean;
  blinkCount: number;
  headMovementRange: number;
  averageFaceConfidence: number;
  framesAnalyzed: number;
  qualityScore: number; // 0-100
  failureReason?: string; // Si isLive = false
  metadata: {
    blinkTimestamps: number[];
    earSequence: number[];
    angleSequence: number[];
    qualityMetrics: FrameQuality[];
  };
  performance?: LivenessPerformance;
}
