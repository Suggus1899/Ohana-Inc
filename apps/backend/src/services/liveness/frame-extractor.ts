import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';
import { DependencyError, LivenessValidationError, LivenessProcessingError } from '../../errors/liveness-errors';

/**
 * Frame Extractor Service
 * 
 * Extrae frames individuales de archivos de video usando ffmpeg.
 * 
 * **Validates: Requirements 6.1, 6.3, 6.5**
 */

/**
 * Valida que ffmpeg esté instalado en el sistema
 * 
 * @throws {Error} FFMPEG_NOT_FOUND - Si ffmpeg no está instalado
 * 
 * **Validates: Requirement 6.1**
 */
async function validateFfmpegInstalled(): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableFormats((err) => {
      if (err) {
        reject(DependencyError.ffmpegNotFound());
      } else {
        resolve();
      }
    });
  });
}

/**
 * Obtiene la duración de un video en segundos
 * 
 * @param videoPath - Ruta al archivo de video
 * @returns Duración del video en segundos
 * @throws {Error} VIDEO_PROCESSING_FAILED - Si no se puede obtener la duración
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(LivenessProcessingError.videoProcessing({ 
          reason: 'Failed to get video duration',
          error: err.message 
        }));
        return;
      }
      
      const duration = metadata.format.duration;
      if (!duration) {
        reject(LivenessProcessingError.videoProcessing({ 
          reason: 'Video duration not found in metadata' 
        }));
        return;
      }
      
      resolve(duration);
    });
  });
}

/**
 * Extrae un frame en un timestamp específico
 * 
 * @param videoPath - Ruta al archivo de video
 * @param timestamp - Timestamp en segundos
 * @param outputPath - Ruta donde guardar el frame
 * @throws {Error} VIDEO_PROCESSING_FAILED - Si falla la extracción
 */
async function extractFrameAtTimestamp(
  videoPath: string,
  timestamp: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timestamp)
      .frames(1)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => {
        reject(LivenessProcessingError.videoProcessing({ 
          reason: 'Failed to extract frame',
          timestamp,
          error: err.message 
        }));
      })
      .run();
  });
}

/**
 * Extrae frames equidistantes de un archivo de video
 * 
 * @param videoPath - Ruta al archivo de video a procesar
 * @param count - Número de frames a extraer (default: 30)
 * @returns Promise que resuelve a un array de buffers, cada uno conteniendo un frame en formato JPEG
 * 
 * @throws {Error} FFMPEG_NOT_FOUND - Si ffmpeg no está instalado en el sistema
 * @throws {Error} INSUFFICIENT_FRAMES - Si no se pueden extraer al menos 20 frames válidos
 * @throws {Error} VIDEO_PROCESSING_FAILED - Si ocurre un error durante la extracción
 * 
 * @example
 * ```typescript
 * const frames = await extractFrames('/path/to/video.mp4', 30);
 * console.log(`Extracted ${frames.length} frames`);
 * ```
 * 
 * **Validaciones:**
 * - Valida que ffmpeg esté instalado antes de procesar (Req 6.1)
 * - Valida que cada frame tenga tamaño > 0 bytes (Req 6.3)
 * - Excluye frames corruptos y continúa con los siguientes (Req 6.4)
 * - Retorna al menos 20 frames válidos o lanza error (Req 6.5)
 */
export async function extractFrames(
  videoPath: string,
  count: number = 30
): Promise<Buffer[]> {
  // Validar que ffmpeg esté instalado (Req 6.1)
  await validateFfmpegInstalled();

  // Crear directorio temporal para frames
  const tempDir = path.join(__dirname, '../../../temp', `frames-${Date.now()}`);
  await fs.ensureDir(tempDir);

  try {
    // Obtener duración del video
    const duration = await getVideoDuration(videoPath);
    
    // Calcular timestamps equidistantes
    const interval = duration / (count + 1);
    const timestamps: number[] = [];
    for (let i = 1; i <= count; i++) {
      timestamps.push(interval * i);
    }

    // Extraer frames en los timestamps calculados
    const validFrames: Buffer[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const framePath = path.join(tempDir, `frame-${i}.jpg`);
      
      try {
        // Extraer frame
        await extractFrameAtTimestamp(videoPath, timestamp, framePath);
        
        // Leer el frame como buffer
        const frameBuffer = await fs.readFile(framePath);
        
        // Validar que el frame tenga tamaño > 0 bytes (Req 6.3)
        if (frameBuffer.length > 0) {
          validFrames.push(frameBuffer);
        } else {
          // Frame corrupto, excluir y continuar (Req 6.4)
          console.warn(`Frame ${i} is corrupted (0 bytes), excluding`);
        }
      } catch (error) {
        // Frame corrupto, excluir y continuar (Req 6.4)
        console.warn(`Failed to extract frame ${i}, excluding: ${error}`);
      }
    }

    // Validar que se extrajeron al menos 20 frames válidos (Req 6.5)
    if (validFrames.length < 20) {
      throw LivenessValidationError.insufficientFrames(validFrames.length);
    }

    return validFrames;
  } finally {
    // Limpiar directorio temporal
    await fs.remove(tempDir);
  }
}
