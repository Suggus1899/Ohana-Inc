/**
 * Head Movement Validator - Validación de movimiento natural de cabeza
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { Point, FrameWithLandmarks, MovementResult } from './types';
import { livenessConfig } from '../../config/liveness.config';

/**
 * Servicio de validación de movimiento de cabeza
 */
export class HeadMovementValidator {
  private movementThreshold: number;
  private significantMovementThreshold: number;

  constructor(movementThreshold?: number, significantMovementThreshold?: number) {
    this.movementThreshold = movementThreshold || livenessConfig.HEAD_MOVEMENT_THRESHOLD;
    this.significantMovementThreshold = significantMovementThreshold || livenessConfig.SIGNIFICANT_MOVEMENT_THRESHOLD;
  }

  /**
   * Calcula ángulo de rotación de cabeza usando landmarks de ojos
   * Requirement 3.1
   * 
   * Fórmula: angle = atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / PI
   * 
   * @param landmarks - Landmarks faciales (68 puntos)
   * @returns Ángulo en grados (-180 a 180)
   */
  public calculateHeadAngle(landmarks: any): number {
    try {
      const positions = landmarks.positions || landmarks._positions;
      
      if (!positions || positions.length < 68) {
        throw new Error('Invalid landmarks: expected 68 points');
      }

      // Obtener landmarks de ojos
      // Ojo izquierdo: punto 36 (esquina exterior)
      // Ojo derecho: punto 45 (esquina exterior)
      const leftEye: Point = {
        x: positions[36].x || positions[36]._x,
        y: positions[36].y || positions[36]._y
      };

      const rightEye: Point = {
        x: positions[45].x || positions[45]._x,
        y: positions[45].y || positions[45]._y
      };

      // Calcular ángulo usando atan2
      const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI;

      // Normalizar a rango [-180, 180]
      let normalizedAngle = angle;
      if (normalizedAngle > 180) {
        normalizedAngle -= 360;
      } else if (normalizedAngle < -180) {
        normalizedAngle += 360;
      }

      return normalizedAngle;
    } catch (error) {
      console.warn('Error calculating head angle:', error);
      return 0;
    }
  }

  /**
   * Valida movimiento de cabeza en secuencia de frames
   * Requirements 3.2, 3.3, 3.4, 3.5
   * 
   * @param frames - Array de frames con landmarks
   * @returns Resultado de validación de movimiento
   */
  public validateMovement(frames: FrameWithLandmarks[]): MovementResult {
    if (frames.length === 0) {
      return {
        isNatural: false,
        angleRange: 0,
        maxAngle: 0,
        minAngle: 0,
        significantMovements: 0,
        angleSequence: []
      };
    }

    const angleSequence: number[] = [];
    let significantMovements = 0;
    let previousAngle: number | null = null;

    // Calcular ángulos para cada frame
    for (const frame of frames) {
      try {
        const angle = this.calculateHeadAngle(frame.landmarks);
        angleSequence.push(angle);

        // Detectar movimientos significativos
        // Requirement 3.2: cambio > 5 grados
        if (previousAngle !== null) {
          const angleDiff = Math.abs(angle - previousAngle);
          if (angleDiff > this.significantMovementThreshold) {
            significantMovements++;
          }
        }

        previousAngle = angle;
      } catch (error) {
        console.warn(`Error processing frame ${frame.frameIndex}:`, error);
        // Continuar con el siguiente frame
      }
    }

    // Calcular rango de movimiento
    // Requirement 3.3: rango = max - min
    const maxAngle = angleSequence.length > 0 ? Math.max(...angleSequence) : 0;
    const minAngle = angleSequence.length > 0 ? Math.min(...angleSequence) : 0;
    const angleRange = maxAngle - minAngle;

    // Clasificar movimiento
    // Requirement 3.4: rango > 15° → natural
    // Requirement 3.5: rango <= 15° → sospechoso
    const isNatural = angleRange > this.movementThreshold;

    return {
      isNatural,
      angleRange,
      maxAngle,
      minAngle,
      significantMovements,
      angleSequence
    };
  }

  /**
   * Obtiene el umbral de movimiento configurado
   */
  public getMovementThreshold(): number {
    return this.movementThreshold;
  }

  /**
   * Obtiene el umbral de movimiento significativo configurado
   */
  public getSignificantMovementThreshold(): number {
    return this.significantMovementThreshold;
  }
}

// Exportar instancia singleton con configuración por defecto
export const headMovementValidator = new HeadMovementValidator();
