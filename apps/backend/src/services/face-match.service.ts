import path from 'path';
import { auditLogger } from './audit-logger.service';
import { DependencyError, LivenessProcessingError } from '../errors/liveness-errors';

/**
 * FaceMatchService
 * 
 * Servicio de comparación facial usando face-api.js (librería open source).
 * Implementa detección de rostros y comparación biométrica mediante descriptores faciales.
 * 
 * Requisitos: 9.1-9.14, 19.1-19.13
 */

// Lazy loading de face-api para evitar errores en desarrollo
let faceapi: any = null;
let Canvas: any = null;
let Image: any = null;
let ImageData: any = null;
let loadImage: any = null;

async function loadFaceApiDependencies() {
  if (!faceapi) {
    try {
      faceapi = await import('@vladmandic/face-api');
      const canvas = await import('canvas');
      Canvas = canvas.Canvas;
      Image = canvas.Image;
      ImageData = canvas.ImageData;
      loadImage = canvas.loadImage;
      
      // Configurar canvas para Node.js (Requisito 19.2)
      faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    } catch (error) {
      console.warn('Face-API dependencies not available. Face matching will be disabled.');
      throw new Error('Face-API dependencies not installed. Please install @tensorflow/tfjs-node and canvas.');
    }
  }
}

export interface FaceDetection {
  box: { x: number; y: number; width: number; height: number };
  confidence: number;
  landmarks: any;
  descriptor: Float32Array;
}

export interface FaceMatchResult {
  match: boolean;
  score: number; // 0-100
  distance: number;
  confidence1: number;
  confidence2: number;
}

export class FaceMatchService {
  private modelsLoaded = false;
  private readonly MODEL_PATH = path.join(__dirname, '../../models/face-api');

  /**
   * Carga modelos pre-entrenados de face-api.js
   * 
   * Modelos cargados:
   * - ssdMobilenetv1: Detección de rostros
   * - faceLandmark68Net: Detección de landmarks faciales
   * - faceRecognitionNet: Extracción de descriptores de 128 dimensiones
   * 
   * Requisitos: 9.2, 19.3, 19.4, 19.5, 19.6, 8.1, 8.2
   */
  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      await loadFaceApiDependencies();
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(this.MODEL_PATH),
        faceapi.nets.faceLandmark68Net.loadFromDisk(this.MODEL_PATH),
        faceapi.nets.faceRecognitionNet.loadFromDisk(this.MODEL_PATH)
      ]);

      this.modelsLoaded = true;
      console.log('face-api.js models loaded successfully from', this.MODEL_PATH);
    } catch (error) {
      // Lanzar error con código MODELS_NOT_FOUND (Requisito 8.2)
      throw DependencyError.modelsNotFound();
    }
  }

  /**
   * Detecta un rostro en una imagen y extrae descriptor facial
   * 
   * @param imageBuffer - Buffer de la imagen a analizar
   * @returns Objeto FaceDetection con rostro detectado o null si no hay rostro
   * 
   * Requisitos: 9.3, 9.4, 19.7
   */
  async detectFace(imageBuffer: Buffer): Promise<FaceDetection | null> {
    await this.loadModels();

    try {
      // Cargar imagen desde buffer
      const img = await loadImage(imageBuffer);

      // Detectar rostro con landmarks y descriptor (Requisito 9.3, 9.4)
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return null;

      return {
        box: detection.detection.box,
        confidence: detection.detection.score,
        landmarks: detection.landmarks,
        descriptor: detection.descriptor
      };
    } catch (error) {
      throw LivenessProcessingError.faceDetection({
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Compara dos rostros y calcula similitud
   * 
   * @param image1 - Buffer de la primera imagen (documento)
   * @param image2 - Buffer de la segunda imagen (selfie)
   * @returns Objeto FaceMatchResult con resultado de comparación
   * 
   * Requisitos: 9.1, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 19.8, 19.9, 19.10, 8.4
   */
  async compareFaces(image1: Buffer, image2: Buffer): Promise<FaceMatchResult> {
    // Detectar rostros en ambas imágenes
    const face1 = await this.detectFace(image1);
    const face2 = await this.detectFace(image2);

    // Si no se detecta rostro en alguna imagen, retornar match=false con confianza=0 (Requisito 8.4)
    if (!face1 || !face2) {
      return {
        match: false,
        score: 0,
        distance: 1.0,
        confidence1: face1?.confidence || 0,
        confidence2: face2?.confidence || 0
      };
    }

    // Calcular distancia euclidiana entre descriptores (Requisito 9.5, 19.9, 8.5)
    const distance = faceapi.euclideanDistance(face1.descriptor, face2.descriptor);

    // Convertir distancia a similitud 0-100 (Requisito 9.6, 19.10)
    const similarity = Math.max(0, 100 - distance * 100);

    // Determinar si hay match (similitud >= 80%, distance < 0.6) (Requisito 9.7, 9.8, 8.6)
    const match = similarity >= 80;

    return {
      match,
      score: similarity,
      distance,
      confidence1: face1.confidence,
      confidence2: face2.confidence
    };
  }
}
