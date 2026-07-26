import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import { FaceMatchService } from './face-match.service';
import { extractFrames } from './liveness/frame-extractor';
import { BlinkDetector } from './liveness/blink-detector';
import { HeadMovementValidator } from './liveness/head-movement-validator';
import { FrameWithLandmarks } from './liveness/types';
import { livenessConfig } from '../config/liveness.config';

/**
 * LivenessDetectionService
 * 
 * Servicio de detección de vida mediante análisis de video.
 * Extrae frames del video, analiza calidad (brillo, nitidez, confianza facial)
 * y determina si el video corresponde a una persona real.
 * 
 * Requisitos: 8.1-8.16, 21.1-21.13
 */

// Lazy loading de face-api y canvas para evitar errores en desarrollo
let faceapi: any = null;
let Canvas: any = null;
let Image: any = null;
let ImageData: any = null;
let loadImage: any = null;

async function loadCanvasDependencies() {
  if (!Canvas) {
    try {
      const canvas = await import('canvas');
      Canvas = canvas.Canvas;
      Image = canvas.Image;
      ImageData = canvas.ImageData;
      loadImage = canvas.loadImage;
    } catch (error) {
      console.warn('Canvas dependencies not available.');
      throw new Error('Canvas dependencies not installed.');
    }
  }
}

async function loadFaceApiDependencies() {
  if (!faceapi) {
    try {
      faceapi = await import('@vladmandic/face-api');
      await loadCanvasDependencies();
      
      // Configurar canvas para Node.js
      faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    } catch (error) {
      console.warn('Face-API dependencies not available.');
      throw new Error('Face-API dependencies not installed.');
    }
  }
}

export interface FrameQuality {
  brightness: number; // 0-255
  sharpness: number; // Laplacian variance
  faceConfidence: number; // 0-100
}

export interface FrameAnalysis {
  frameNumber: number;
  faceDetected: boolean;
  faceConfidence: number;
  brightness: number;
  sharpness: number;
  isValid: boolean;
}

export interface LivenessResult {
  isLive: boolean;
  confidence: number; // 0-100
  details: FrameAnalysis[];
  averageBrightness: number;
  averageSharpness: number;
  averageFaceConfidence: number;
  blinkCount: number;
  headMovementRange: {
    yaw: number;
    pitch: number;
    roll: number;
  };
}

export class LivenessDetectionService {
  private faceMatchService: FaceMatchService;
  private blinkDetector: BlinkDetector;
  private headMovementValidator: HeadMovementValidator;

  constructor() {
    this.faceMatchService = new FaceMatchService();
    this.blinkDetector = new BlinkDetector();
    this.headMovementValidator = new HeadMovementValidator();
  }

  /**
   * Calcula el brillo promedio de un frame usando canvas API
   * 
   * @param frameBuffer - Buffer del frame a analizar
   * @returns Valor de brillo promedio (0-255)
   * 
   * Requisitos: 21.4
   */
  async calculateBrightness(frameBuffer: Buffer): Promise<number> {
    try {
      await loadCanvasDependencies();
      
      // Cargar imagen en canvas
      const img = await loadImage(frameBuffer);
      const canvas = new Canvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(img, 0, 0);
      
      // Obtener datos de píxeles
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      
      // Calcular brillo promedio (promedio de R, G, B para cada píxel)
      let totalBrightness = 0;
      const pixelCount = data.length / 4; // 4 valores por píxel (RGBA)
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Fórmula de luminancia: 0.299*R + 0.587*G + 0.114*B
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
      }
      
      return totalBrightness / pixelCount;
    } catch (error) {
      throw new Error(`Failed to calculate brightness: ${error}`);
    }
  }

  /**
   * Calcula la nitidez de un frame usando Laplacian variance con sharp
   * 
   * @param frameBuffer - Buffer del frame a analizar
   * @returns Valor de nitidez (Laplacian variance)
   * 
   * Requisitos: 21.5
   */
  async calculateSharpness(frameBuffer: Buffer): Promise<number> {
    try {
      // Convertir a escala de grises
      const grayImage = await sharp(frameBuffer)
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = grayImage;
      const { width, height } = info;

      // Aplicar operador Laplaciano
      // Kernel Laplaciano: [0, 1, 0], [1, -4, 1], [0, 1, 0]
      let laplacianSum = 0;
      let count = 0;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          
          const center = data[idx];
          const top = data[(y - 1) * width + x];
          const bottom = data[(y + 1) * width + x];
          const left = data[y * width + (x - 1)];
          const right = data[y * width + (x + 1)];
          
          // Aplicar kernel Laplaciano
          const laplacian = Math.abs(
            -4 * center + top + bottom + left + right
          );
          
          laplacianSum += laplacian * laplacian; // Varianza
          count++;
        }
      }

      // Retornar varianza promedio (medida de nitidez)
      return count > 0 ? laplacianSum / count : 0;
    } catch (error) {
      throw new Error(`Failed to calculate sharpness: ${error}`);
    }
  }

  /**
   * Analiza la calidad de un frame (brillo, nitidez, confianza facial)
   * 
   * @param frameBuffer - Buffer del frame a analizar
   * @returns Objeto FrameQuality con métricas de calidad
   * 
   * Requisitos: 21.4, 21.5, 21.6
   */
  async analyzeFrameQuality(frameBuffer: Buffer): Promise<FrameQuality> {
    try {
      // Calcular brillo
      const brightness = await this.calculateBrightness(frameBuffer);

      // Calcular nitidez
      const sharpness = await this.calculateSharpness(frameBuffer);

      // Detectar rostro y obtener confianza
      const faceDetection = await this.faceMatchService.detectFace(frameBuffer);
      const faceConfidence = faceDetection ? faceDetection.confidence * 100 : 0;

      return {
        brightness,
        sharpness,
        faceConfidence
      };
    } catch (error) {
      throw new Error(`Failed to analyze frame quality: ${error}`);
    }
  }

  /**
   * Analiza un video de liveness y determina si es una persona real
   * 
   * @param videoPath - Ruta al archivo de video
   * @returns Objeto LivenessResult con resultado del análisis
   * 
   * Requisitos: 8.11-8.16, 21.1-21.13
   */
  async analyzeLiveness(videoPath: string): Promise<LivenessResult> {
    try {
      // Validar que el archivo existe
      const exists = await fs.pathExists(videoPath);
      if (!exists) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      // Extraer 30 frames equidistantes usando el nuevo Frame Extractor (Requisito 6.1-6.6, 21.2)
      const frames = await extractFrames(videoPath, 30);

      // Analizar cada frame (Requisito 21.3, 21.4, 21.5, 21.6)
      const frameAnalyses: FrameAnalysis[] = [];
      const framesWithLandmarks: FrameWithLandmarks[] = [];
      let totalBrightness = 0;
      let totalSharpness = 0;
      let totalFaceConfidence = 0;
      let validFrameCount = 0;

      for (let i = 0; i < frames.length; i++) {
        const frameBuffer = frames[i];
        const quality = await this.analyzeFrameQuality(frameBuffer);

        // Determinar si el frame es válido (Requisito 21.7)
        // Frame válido si: brightness > 40 AND sharpness > 50 AND faceConfidence > 90
        const isValid = 
          quality.brightness > 40 &&
          quality.sharpness > 50 &&
          quality.faceConfidence > 90;

        const analysis: FrameAnalysis = {
          frameNumber: i + 1,
          faceDetected: quality.faceConfidence > 0,
          faceConfidence: quality.faceConfidence,
          brightness: quality.brightness,
          sharpness: quality.sharpness,
          isValid
        };

        frameAnalyses.push(analysis);

        // Acumular para promedios
        totalBrightness += quality.brightness;
        totalSharpness += quality.sharpness;
        totalFaceConfidence += quality.faceConfidence;

        if (isValid) {
          validFrameCount++;
        }

        // Detectar rostro con landmarks para blink y head movement detection
        try {
          const faceDetection = await this.faceMatchService.detectFace(frameBuffer);
          if (faceDetection && faceDetection.landmarks) {
            framesWithLandmarks.push({
              frameIndex: i,
              landmarks: faceDetection.landmarks,
              timestamp: i * (1000 / 30), // Asumiendo 30 fps
              faceConfidence: faceDetection.confidence
            });
          }
        } catch (error) {
          console.warn(`Failed to detect landmarks for frame ${i}:`, error);
        }
      }

      // Calcular promedios (Requisito 21.8)
      const averageBrightness = totalBrightness / frames.length;
      const averageSharpness = totalSharpness / frames.length;
      const averageFaceConfidence = totalFaceConfidence / frames.length;

      // Detectar parpadeos usando BlinkDetector
      const blinkResult = this.blinkDetector.detectBlinks(framesWithLandmarks);
      const blinkCount = blinkResult.blinkCount;

      // Validar movimiento de cabeza usando HeadMovementValidator
      const movementResult = this.headMovementValidator.validateMovement(framesWithLandmarks);
      const headMovementRange = {
        yaw: movementResult.angleRange,
        pitch: 0, // No implementado en esta versión
        roll: 0   // No implementado en esta versión
      };

      // Determinar si es live (Requisito 21.9)
      // isLive: true solo si TODOS los frames son válidos Y confianza promedio >= 85
      // Y blinkCount >= 2 Y headMovementRange.yaw >= 15
      const allFramesValid = validFrameCount === frames.length;
      const isLive = allFramesValid 
                     && averageFaceConfidence >= 85
                     && blinkCount >= livenessConfig.MIN_BLINKS_REQUIRED
                     && headMovementRange.yaw >= livenessConfig.HEAD_MOVEMENT_THRESHOLD;

      return {
        isLive,
        confidence: averageFaceConfidence,
        details: frameAnalyses,
        averageBrightness,
        averageSharpness,
        averageFaceConfidence,
        blinkCount,
        headMovementRange
      };
    } catch (error) {
      throw new Error(`Liveness analysis failed: ${error}`);
    }
  }
}
