/**
 * Blink Detector - Detección de parpadeos usando Eye Aspect Ratio (EAR)
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { Point, FrameWithLandmarks, BlinkResult } from './types';
import { livenessConfig } from '../../config/liveness.config';

/**
 * Servicio de detección de parpadeos
 */
export class BlinkDetector {
  private earThreshold: number;

  constructor(earThreshold?: number) {
    this.earThreshold = earThreshold || livenessConfig.BLINK_EAR_THRESHOLD;
  }

  /**
   * Calcula la distancia euclidiana entre dos puntos
   * Requirement 1.5
   * @param p1 - Primer punto
   * @param p2 - Segundo punto
   * @returns Distancia euclidiana
   */
  private distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Calcula Eye Aspect Ratio (EAR) para un ojo
   * Requirement 1.1, 1.5
   * 
   * Fórmula: EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
   * 
   * @param eyeLandmarks - Array de 6 puntos del ojo
   * @returns EAR value (0-1, típicamente 0.15-0.35)
   */
  public calculateEAR(eyeLandmarks: Point[]): number {
    if (eyeLandmarks.length !== 6) {
      throw new Error('Eye landmarks must contain exactly 6 points');
    }

    const p1 = eyeLandmarks[0];
    const p2 = eyeLandmarks[1];
    const p3 = eyeLandmarks[2];
    const p4 = eyeLandmarks[3];
    const p5 = eyeLandmarks[4];
    const p6 = eyeLandmarks[5];

    // Calcular distancias verticales
    const vertical1 = this.distance(p2, p6);
    const vertical2 = this.distance(p3, p5);

    // Calcular distancia horizontal
    const horizontal = this.distance(p1, p4);

    // Evitar división por cero
    if (horizontal === 0) {
      return 0;
    }

    // Calcular EAR
    const ear = (vertical1 + vertical2) / (2 * horizontal);

    // Asegurar que el resultado esté en rango [0, 1]
    return Math.max(0, Math.min(1, ear));
  }

  /**
   * Determina si los ojos están cerrados basado en EAR
   * Requirements 1.2, 1.3
   * 
   * @param leftEAR - EAR del ojo izquierdo
   * @param rightEAR - EAR del ojo derecho
   * @param threshold - Umbral de EAR (default: configuración)
   * @returns true si ojos cerrados
   */
  public areEyesClosed(leftEAR: number, rightEAR: number, threshold?: number): boolean {
    const earThreshold = threshold !== undefined ? threshold : this.earThreshold;
    const avgEAR = (leftEAR + rightEAR) / 2;
    
    // Requirement 1.2: EAR < 0.2 → ojos cerrados
    // Requirement 1.3: EAR >= 0.2 → ojos abiertos
    return avgEAR < earThreshold;
  }

  /**
   * Detecta parpadeos en secuencia de frames
   * Requirements 1.4, 2.3
   * 
   * Un parpadeo se detecta cuando hay una transición de ojos cerrados a ojos abiertos
   * 
   * @param frames - Array de frames con landmarks
   * @returns Resultado de detección de parpadeos
   */
  public detectBlinks(frames: FrameWithLandmarks[]): BlinkResult {
    if (frames.length === 0) {
      return {
        blinkCount: 0,
        blinkTimestamps: [],
        averageEAR: 0,
        earSequence: []
      };
    }

    let blinkCount = 0;
    const blinkTimestamps: number[] = [];
    const earSequence: number[] = [];
    let previousEyesClosed = false;
    let totalEAR = 0;

    for (const frame of frames) {
      try {
        // Obtener landmarks de los ojos
        const leftEyeLandmarks = this.extractEyeLandmarks(frame.landmarks, 'left');
        const rightEyeLandmarks = this.extractEyeLandmarks(frame.landmarks, 'right');

        // Calcular EAR para cada ojo
        const leftEAR = this.calculateEAR(leftEyeLandmarks);
        const rightEAR = this.calculateEAR(rightEyeLandmarks);
        const avgEAR = (leftEAR + rightEAR) / 2;

        earSequence.push(avgEAR);
        totalEAR += avgEAR;

        // Determinar si ojos están cerrados
        const eyesClosed = this.areEyesClosed(leftEAR, rightEAR);

        // Detectar transición cerrado → abierto (parpadeo)
        // Requirement 1.4
        if (previousEyesClosed && !eyesClosed) {
          blinkCount++;
          blinkTimestamps.push(frame.timestamp);
        }

        previousEyesClosed = eyesClosed;
      } catch (error) {
        console.warn(`Error processing frame ${frame.frameIndex}:`, error);
        // Continuar con el siguiente frame
      }
    }

    const averageEAR = frames.length > 0 ? totalEAR / frames.length : 0;

    return {
      blinkCount,
      blinkTimestamps,
      averageEAR,
      earSequence
    };
  }

  /**
   * Extrae landmarks de un ojo específico
   * @param landmarks - Landmarks faciales completos (68 puntos)
   * @param eye - 'left' o 'right'
   * @returns Array de 6 puntos del ojo
   */
  private extractEyeLandmarks(landmarks: any, eye: 'left' | 'right'): Point[] {
    // Face-api.js usa 68 landmarks
    // Ojo izquierdo: puntos 36-41 (índices 36-41)
    // Ojo derecho: puntos 42-47 (índices 42-47)
    
    const positions = landmarks.positions || landmarks._positions;
    
    if (!positions || positions.length < 68) {
      throw new Error('Invalid landmarks: expected 68 points');
    }

    const startIndex = eye === 'left' ? 36 : 42;
    const eyePoints: Point[] = [];

    for (let i = 0; i < 6; i++) {
      const point = positions[startIndex + i];
      eyePoints.push({
        x: point.x || point._x,
        y: point.y || point._y
      });
    }

    return eyePoints;
  }
}

// Exportar instancia singleton con configuración por defecto
export const blinkDetector = new BlinkDetector();
