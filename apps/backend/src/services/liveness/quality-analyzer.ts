/**
 * Quality Analyzer - Análisis de calidad de frames con umbrales mejorados
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';
import * as faceapi from '@vladmandic/face-api';
import { FrameQuality } from './types';
import { livenessConfig } from '../../config/liveness.config';

/**
 * Servicio de análisis de calidad de frames
 */
export class QualityAnalyzer {
  private minBrightness: number;
  private maxBrightness: number;
  private sharpnessThreshold: number;
  private faceConfidenceThreshold: number;

  constructor(
    minBrightness?: number,
    maxBrightness?: number,
    sharpnessThreshold?: number,
    faceConfidenceThreshold?: number
  ) {
    this.minBrightness = minBrightness || livenessConfig.MIN_BRIGHTNESS;
    this.maxBrightness = maxBrightness || livenessConfig.MAX_BRIGHTNESS;
    this.sharpnessThreshold = sharpnessThreshold || livenessConfig.SHARPNESS_THRESHOLD;
    this.faceConfidenceThreshold = faceConfidenceThreshold || livenessConfig.FACE_CONFIDENCE_THRESHOLD;
  }

  /**
   * Calcula el brillo promedio de un frame
   * @param frameBuffer - Buffer de imagen
   * @returns Brillo promedio (0-255)
   */
  private async calculateBrightness(frameBuffer: Buffer): Promise<number> {
    try {
      // Convertir a escala de grises y obtener estadísticas
      const { data, info } = await sharp(frameBuffer)
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Calcular brillo promedio
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }

      const avgBrightness = sum / data.length;
      return avgBrightness;
    } catch (error) {
      console.warn('Error calculating brightness:', error);
      return 0;
    }
  }

  /**
   * Calcula la nitidez de un frame usando varianza de Laplaciano
   * @param frameBuffer - Buffer de imagen
   * @returns Valor de nitidez (mayor = más nítido)
   */
  private async calculateSharpness(frameBuffer: Buffer): Promise<number> {
    try {
      // Aplicar operador Laplaciano
      const laplacian = await sharp(frameBuffer)
        .greyscale()
        .convolve({
          width: 3,
          height: 3,
          kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0]
        })
        .raw()
        .toBuffer();

      // Calcular varianza (medida de nitidez)
      let sum = 0;
      let sumSquared = 0;
      
      for (let i = 0; i < laplacian.length; i++) {
        sum += laplacian[i];
        sumSquared += laplacian[i] * laplacian[i];
      }

      const mean = sum / laplacian.length;
      const variance = (sumSquared / laplacian.length) - (mean * mean);

      return variance;
    } catch (error) {
      console.warn('Error calculating sharpness:', error);
      return 0;
    }
  }

  /**
   * Analiza la calidad de un frame
   * Requirements 5.1, 5.2, 5.3
   * 
   * @param frameBuffer - Buffer de imagen
   * @param faceConfidence - Confianza de detección facial (opcional)
   * @returns Métricas de calidad
   */
  public async analyzeFrameQuality(
    frameBuffer: Buffer,
    faceConfidence?: number
  ): Promise<FrameQuality> {
    // Calcular métricas
    const brightness = await this.calculateBrightness(frameBuffer);
    const sharpness = await this.calculateSharpness(frameBuffer);
    const confidence = faceConfidence || 0;

    // Validar umbrales
    // Requirement 5.1: 50 <= brightness <= 200
    const brightnessValid = brightness >= this.minBrightness && brightness <= this.maxBrightness;
    
    // Requirement 5.2: sharpness > 100
    const sharpnessValid = sharpness > this.sharpnessThreshold;
    
    // Requirement 5.3: faceConfidence > 92%
    const confidenceValid = confidence > this.faceConfidenceThreshold;

    const meetsThresholds = brightnessValid && sharpnessValid && confidenceValid;

    return {
      brightness,
      sharpness,
      faceConfidence: confidence,
      meetsThresholds
    };
  }

  /**
   * Valida que un conjunto de frames cumpla umbrales de calidad
   * Requirements 5.4, 5.5
   * 
   * @param qualities - Array de calidades de frames
   * @param minPassRate - Porcentaje mínimo de frames válidos (default: 0.8)
   * @returns true si cumple umbrales
   */
  public validateQualityThresholds(
    qualities: FrameQuality[],
    minPassRate?: number
  ): boolean {
    if (qualities.length === 0) {
      return false;
    }

    const passRate = minPassRate !== undefined ? minPassRate : livenessConfig.MIN_VALID_FRAME_RATE;

    // Contar frames que cumplen umbrales
    const validFrames = qualities.filter(q => q.meetsThresholds).length;
    const validRate = validFrames / qualities.length;

    // Requirement 5.4: >= 80% de frames válidos → aceptable
    // Requirement 5.5: < 80% de frames válidos → rechazar
    return validRate >= passRate;
  }

  /**
   * Calcula un score de calidad general (0-100)
   * @param qualities - Array de calidades de frames
   * @returns Score de calidad
   */
  public calculateQualityScore(qualities: FrameQuality[]): number {
    if (qualities.length === 0) {
      return 0;
    }

    // Calcular porcentaje de frames válidos
    const validFrames = qualities.filter(q => q.meetsThresholds).length;
    const validRate = validFrames / qualities.length;

    // Calcular promedios de métricas
    const avgBrightness = qualities.reduce((sum, q) => sum + q.brightness, 0) / qualities.length;
    const avgSharpness = qualities.reduce((sum, q) => sum + q.sharpness, 0) / qualities.length;
    const avgConfidence = qualities.reduce((sum, q) => sum + q.faceConfidence, 0) / qualities.length;

    // Normalizar métricas a escala 0-1
    const brightnessScore = Math.max(0, Math.min(1, 
      (avgBrightness - this.minBrightness) / (this.maxBrightness - this.minBrightness)
    ));
    
    const sharpnessScore = Math.min(1, avgSharpness / (this.sharpnessThreshold * 2));
    const confidenceScore = avgConfidence / 100;

    // Combinar scores (peso mayor a tasa de frames válidos)
    const qualityScore = (
      validRate * 0.4 +
      brightnessScore * 0.2 +
      sharpnessScore * 0.2 +
      confidenceScore * 0.2
    ) * 100;

    return Math.round(qualityScore);
  }

  /**
   * Obtiene los umbrales configurados
   */
  public getThresholds() {
    return {
      minBrightness: this.minBrightness,
      maxBrightness: this.maxBrightness,
      sharpnessThreshold: this.sharpnessThreshold,
      faceConfidenceThreshold: this.faceConfidenceThreshold
    };
  }
}

// Exportar instancia singleton con configuración por defecto
export const qualityAnalyzer = new QualityAnalyzer();
