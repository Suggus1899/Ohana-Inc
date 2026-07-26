/**
 * Liveness Detection Service - Orquestador de análisis de liveness
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import * as faceapi from '@vladmandic/face-api';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path from 'path';
import { extractFrames } from './frame-extractor';
import { BlinkDetector } from './blink-detector';
import { HeadMovementValidator } from './head-movement-validator';
import { QualityAnalyzer } from './quality-analyzer';
import { LivenessResult, FrameWithLandmarks, FrameQuality } from './types';
import { livenessConfig } from '../../config/liveness.config';
import { DependencyError, LivenessValidationError, LivenessProcessingError, QualityError } from '../../errors/liveness-errors';

// Configurar canvas para Node.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

/**
 * Servicio de detección de liveness
 * 
 * Orquesta el análisis completo de liveness:
 * 1. Extracción de frames del video
 * 2. Detección de rostros y landmarks
 * 3. Análisis de calidad de frames
 * 4. Detección de parpadeos
 * 5. Validación de movimiento de cabeza
 */
export class LivenessDetectionService {
  private modelsLoaded = false;
  private readonly MODEL_PATH = path.join(__dirname, '../../../models/face-api');
  
  private blinkDetector: BlinkDetector;
  private headMovementValidator: HeadMovementValidator;
  private qualityAnalyzer: QualityAnalyzer;

  constructor() {
    this.blinkDetector = new BlinkDetector();
    this.headMovementValidator = new HeadMovementValidator();
    this.qualityAnalyzer = new QualityAnalyzer();
  }

  /**
   * Carga modelos pre-entrenados de face-api.js
   * 
   * Modelos cargados:
   * - ssdMobilenetv1: Detección de rostros
   * - faceLandmark68Net: Detección de landmarks faciales (68 puntos)
   */
  private async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(this.MODEL_PATH),
        faceapi.nets.faceLandmark68Net.loadFromDisk(this.MODEL_PATH)
      ]);

      this.modelsLoaded = true;
      console.log('Liveness detection models loaded successfully');
    } catch (error) {
      throw DependencyError.modelsNotFound();
    }
  }

  /**
   * Detecta rostro y landmarks en un frame
   * 
   * @param frameBuffer - Buffer del frame
   * @param frameIndex - Índice del frame
   * @param timestamp - Timestamp del frame en el video
   * @returns FrameWithLandmarks o null si no se detecta rostro
   */
  private async detectFaceInFrame(
    frameBuffer: Buffer,
    frameIndex: number,
    timestamp: number
  ): Promise<FrameWithLandmarks | null> {
    try {
      // Cargar imagen desde buffer
      const img = await loadImage(frameBuffer);

      // Detectar rostro con landmarks
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks();

      if (!detection) {
        return null;
      }

      return {
        frameIndex,
        landmarks: detection.landmarks,
        timestamp,
        faceConfidence: detection.detection.score * 100
      };
    } catch (error) {
      console.warn(`Error detecting face in frame ${frameIndex}:`, error);
      throw LivenessProcessingError.faceDetection({ 
        frameIndex, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Analiza video completo para liveness
   * Requirement 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   * 
   * Flujo de análisis:
   * 1. extractFrames(videoPath, 30) - Extraer 30 frames equidistantes
   * 2. detectFaces() - Detectar rostros y landmarks en cada frame
   * 3. analyzeQuality() - Validar calidad de frames
   * 4. detectBlinks() - Contar parpadeos
   * 5. validateMovement() - Validar movimiento de cabeza
   * 
   * @param videoPath - Ruta al archivo de video
   * @returns Resultado completo de análisis
   * @throws Error con códigos específicos si falla algún paso
   */
  public async analyzeLiveness(videoPath: string): Promise<LivenessResult> {
    // Registrar inicio de procesamiento (Requisito 10.2)
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    
    let frameExtractionTime = 0;
    let blinkDetectionTime = 0;
    let qualityAnalysisTime = 0;

    // Cargar modelos si no están cargados
    await this.loadModels();

    // Paso 1: Extraer frames del video
    // Requirement 2.1: extraer al menos 30 frames equidistantes
    let frameBuffers: Buffer[];
    try {
      const frameStart = Date.now();
      frameBuffers = await extractFrames(videoPath, livenessConfig.LIVENESS_FRAME_COUNT);
      frameExtractionTime = Date.now() - frameStart;
    } catch (error: any) {
      // Propagar errores de extracción (FFMPEG_NOT_FOUND, INSUFFICIENT_FRAMES, etc.)
      throw error;
    }

    // Paso 2: Detectar rostros y landmarks en cada frame
    // Requirement 2.2: detectar landmarks faciales en cada frame
    const framesWithLandmarks: FrameWithLandmarks[] = [];
    const qualityMetrics: FrameQuality[] = [];
    
    const qualityStart = Date.now();
    for (let i = 0; i < frameBuffers.length; i++) {
      const frameBuffer = frameBuffers[i];
      const timestamp = i / frameBuffers.length; // Timestamp normalizado 0-1

      // Detectar rostro y landmarks
      const frameWithLandmarks = await this.detectFaceInFrame(frameBuffer, i, timestamp);
      
      if (frameWithLandmarks) {
        framesWithLandmarks.push(frameWithLandmarks);
        
        // Analizar calidad del frame
        const quality = await this.qualityAnalyzer.analyzeFrameQuality(
          frameBuffer,
          frameWithLandmarks.faceConfidence
        );
        qualityMetrics.push(quality);
      } else {
        // Frame sin rostro detectado - agregar calidad con confianza 0
        const quality = await this.qualityAnalyzer.analyzeFrameQuality(frameBuffer, 0);
        qualityMetrics.push(quality);
      }
    }
    qualityAnalysisTime = Date.now() - qualityStart;

    // Validar que se detectaron suficientes rostros
    if (framesWithLandmarks.length < 10) {
      throw LivenessValidationError.faceNotDetected('video');
    }

    // Paso 3: Validar calidad de frames
    // Requirement 2.3: validar umbrales de calidad
    const qualityValid = this.qualityAnalyzer.validateQualityThresholds(qualityMetrics);
    
    if (!qualityValid) {
      const qualityScore = this.qualityAnalyzer.calculateQualityScore(qualityMetrics);
      const validFrames = qualityMetrics.filter(q => q.meetsThresholds).length;
      
      throw new QualityError(
        'La calidad del video es insuficiente. Por favor, graba en un lugar bien iluminado.',
        {
          qualityScore,
          validFrames,
          totalFrames: qualityMetrics.length,
          validRate: (validFrames / qualityMetrics.length * 100).toFixed(1) + '%'
        }
      );
    }

    // Paso 4: Detectar parpadeos
    // Requirement 2.3: contar parpadeos
    const blinkStart = Date.now();
    const blinkResult = this.blinkDetector.detectBlinks(framesWithLandmarks);
    blinkDetectionTime = Date.now() - blinkStart;

    // Paso 5: Validar movimiento de cabeza
    const movementResult = this.headMovementValidator.validateMovement(framesWithLandmarks);

    // Calcular métricas generales
    const averageFaceConfidence = framesWithLandmarks.reduce(
      (sum, frame) => sum + frame.faceConfidence,
      0
    ) / framesWithLandmarks.length;

    const qualityScore = this.qualityAnalyzer.calculateQualityScore(qualityMetrics);

    // Determinar si el video contiene una persona real
    // Requirement 2.4: al menos 2 parpadeos → persona real
    // Requirement 2.5: menos de 2 parpadeos → posible ataque
    // Bug Fix 1.3: También validar movimiento de cabeza (yaw >= 15 grados)
    const hasEnoughBlinks = blinkResult.blinkCount >= livenessConfig.MIN_BLINKS_REQUIRED;
    const hasEnoughHeadMovement = movementResult.angleRange >= livenessConfig.HEAD_MOVEMENT_THRESHOLD;
    const isLive = hasEnoughBlinks && hasEnoughHeadMovement;
    
    if (!isLive) {
      // Determinar razón de falla
      let failureReason = '';
      if (!hasEnoughBlinks && !hasEnoughHeadMovement) {
        failureReason = `Insufficient blinks (${blinkResult.blinkCount}/${livenessConfig.MIN_BLINKS_REQUIRED}) and head movement (${movementResult.angleRange.toFixed(1)}°/${livenessConfig.HEAD_MOVEMENT_THRESHOLD}°)`;
      } else if (!hasEnoughBlinks) {
        failureReason = `Insufficient blinks (${blinkResult.blinkCount}/${livenessConfig.MIN_BLINKS_REQUIRED})`;
      } else {
        failureReason = `Insufficient head movement (${movementResult.angleRange.toFixed(1)}°/${livenessConfig.HEAD_MOVEMENT_THRESHOLD}°)`;
      }
      
      throw LivenessValidationError.livenessFailed(blinkResult.blinkCount, {
        headMovementRange: movementResult.angleRange,
        averageFaceConfidence,
        qualityScore,
        failureReason
      });
    }

    // Registrar métricas de performance (Requisito 10.2)
    const totalProcessingTime = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const memoryUsageMB = endMemory - startMemory;

    // Requirement 2.6: retornar resultado completo con metadata
    return {
      isLive: true,
      blinkCount: blinkResult.blinkCount,
      headMovementRange: movementResult.angleRange,
      averageFaceConfidence,
      framesAnalyzed: frameBuffers.length,
      qualityScore,
      failureReason: undefined,
      metadata: {
        blinkTimestamps: blinkResult.blinkTimestamps,
        earSequence: blinkResult.earSequence,
        angleSequence: movementResult.angleSequence,
        qualityMetrics
      },
      performance: {
        totalProcessingTime,
        frameExtractionTime,
        blinkDetectionTime,
        qualityAnalysisTime,
        memoryUsageMB: Math.max(0, memoryUsageMB)
      }
    };
  }
}

// Exportar instancia singleton
export const livenessDetectionService = new LivenessDetectionService();
