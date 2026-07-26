import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Servicio de validación de dependencias del sistema
 * Valida que todas las dependencias requeridas estén disponibles
 */
export class DependencyValidator {
  private static instance: DependencyValidator;
  private validationResults: Map<string, boolean> = new Map();

  private constructor() {}

  public static getInstance(): DependencyValidator {
    if (!DependencyValidator.instance) {
      DependencyValidator.instance = new DependencyValidator();
    }
    return DependencyValidator.instance;
  }

  /**
   * Valida todas las dependencias del sistema
   * @throws Error si alguna dependencia crítica falta
   */
  public async validateAll(): Promise<void> {
    console.log('🔍 Validating system dependencies...');

    const results = await Promise.allSettled([
      this.validateFFmpeg(),
      this.validateFaceApiModels(),
      this.validateTesseract()
    ]);

    const failures: string[] = [];

    results.forEach((result, index) => {
      const dependencyNames = ['FFmpeg', 'Face-API Models', 'Tesseract'];
      if (result.status === 'rejected') {
        failures.push(`${dependencyNames[index]}: ${result.reason}`);
      }
    });

    if (failures.length > 0) {
      const errorMessage = `❌ Critical dependencies missing:\n${failures.join('\n')}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ All system dependencies validated successfully');
  }

  /**
   * Valida que ffmpeg esté instalado y disponible
   */
  public async validateFFmpeg(): Promise<void> {
    try {
      const { stdout } = await execAsync('ffmpeg -version');
      
      if (!stdout.includes('ffmpeg version')) {
        throw new Error('FFmpeg output format unexpected');
      }

      this.validationResults.set('ffmpeg', true);
      console.log('✅ FFmpeg is available');
    } catch (error: any) {
      this.validationResults.set('ffmpeg', false);
      const message = 'FFmpeg is not installed or not in PATH. Please install FFmpeg to enable video processing.';
      console.error(`❌ ${message}`);
      throw new Error(message);
    }
  }

  /**
   * Valida que los modelos de face-api.js existan
   */
  public async validateFaceApiModels(): Promise<void> {
    const modelsPath = path.join(process.cwd(), 'models', 'face-api');
    
    const requiredModels = [
      'ssd_mobilenetv1_model-weights_manifest.json',
      'face_landmark_68_model-weights_manifest.json',
      'face_recognition_model-weights_manifest.json'
    ];

    try {
      // Verificar que el directorio existe
      if (!fs.existsSync(modelsPath)) {
        throw new Error(`Models directory not found: ${modelsPath}`);
      }

      // Verificar que cada modelo requerido existe
      const missingModels: string[] = [];
      for (const model of requiredModels) {
        const modelPath = path.join(modelsPath, model);
        if (!fs.existsSync(modelPath)) {
          missingModels.push(model);
        }
      }

      if (missingModels.length > 0) {
        throw new Error(`Missing face-api.js models: ${missingModels.join(', ')}`);
      }

      this.validationResults.set('faceApiModels', true);
      console.log('✅ Face-API models are available');
    } catch (error: any) {
      this.validationResults.set('faceApiModels', false);
      const message = `Face-API models not found. ${error.message}. Please download models to ${modelsPath}`;
      console.error(`❌ ${message}`);
      throw new Error(message);
    }
  }

  /**
   * Valida que Tesseract.js pueda inicializarse
   */
  public async validateTesseract(): Promise<void> {
    try {
      // Tesseract.js se descarga automáticamente, solo verificamos que el módulo esté disponible
      const tesseract = require('tesseract.js');
      
      if (!tesseract || !tesseract.createWorker) {
        throw new Error('Tesseract.js module not properly installed');
      }

      this.validationResults.set('tesseract', true);
      console.log('✅ Tesseract.js is available');
    } catch (error: any) {
      this.validationResults.set('tesseract', false);
      const message = 'Tesseract.js is not available. Please ensure tesseract.js is installed: npm install tesseract.js';
      console.error(`❌ ${message}`);
      throw new Error(message);
    }
  }

  /**
   * Obtiene el estado de validación de una dependencia específica
   */
  public isValidated(dependency: 'ffmpeg' | 'faceApiModels' | 'tesseract'): boolean {
    return this.validationResults.get(dependency) || false;
  }

  /**
   * Obtiene todos los resultados de validación
   */
  public getValidationResults(): Map<string, boolean> {
    return new Map(this.validationResults);
  }
}

// Exportar instancia singleton
export const dependencyValidator = DependencyValidator.getInstance();
