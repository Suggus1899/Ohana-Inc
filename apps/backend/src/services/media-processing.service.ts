import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { STORAGE_PATHS } from '../config/storage.config';

export class MediaProcessingService {
  private readonly MAX_VIDEO_DURATION_SECONDS = 120;
  private readonly THUMBNAIL_WIDTH = 300;
  private readonly THUMBNAIL_HEIGHT = 200;
  private readonly MAX_IMAGE_WIDTH = 1920;

  async processImage(filePath: string): Promise<{ processedPath: string; thumbnailPath: string }> {
    const filename = path.basename(filePath, path.extname(filePath));
    const ext = '.webp';

    const processedPath = path.join(STORAGE_PATHS.IMAGES_DIR, `${filename}-opt${ext}`);
    const thumbnailPath = path.join(STORAGE_PATHS.THUMBNAILS_DIR, `${filename}-thumb${ext}`);

    await sharp(filePath)
      .resize({ width: this.MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(processedPath);

    await sharp(filePath)
      .resize(this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT, { fit: 'cover' })
      .webp({ quality: 70 })
      .toFile(thumbnailPath);

    await fs.unlink(filePath);

    return { processedPath, thumbnailPath };
  }

  async processImages(filePaths: string[]): Promise<{ processedPaths: string[]; thumbnailPaths: string[] }> {
    const results = await Promise.all(filePaths.map((fp) => this.processImage(fp)));
    return {
      processedPaths: results.map((r) => r.processedPath),
      thumbnailPaths: results.map((r) => r.thumbnailPath),
    };
  }

  getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(new Error(`Error leyendo video: ${err.message}`));
        const duration = metadata.format.duration ?? 0;
        resolve(duration);
      });
    });
  }

  async validateVideoDuration(filePath: string): Promise<void> {
    const duration = await this.getVideoDuration(filePath);
    if (duration > this.MAX_VIDEO_DURATION_SECONDS) {
      await fs.unlink(filePath);
      throw new Error(
        `El video excede la duración máxima de 2 minutos (duración actual: ${Math.round(duration)}s)`
      );
    }
  }

  async generateVideoThumbnail(videoPath: string): Promise<string> {
    const filename = path.basename(videoPath, path.extname(videoPath));
    const thumbnailPath = path.join(STORAGE_PATHS.THUMBNAILS_DIR, `${filename}-thumb.jpg`);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          count: 1,
          folder: STORAGE_PATHS.THUMBNAILS_DIR,
          filename: `${filename}-thumb.jpg`,
          size: `${this.THUMBNAIL_WIDTH}x${this.THUMBNAIL_HEIGHT}`,
          timemarks: ['1'],
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', (err) => reject(new Error(`Error generando thumbnail: ${err.message}`)));
    });
  }

  async processVideo(filePath: string): Promise<{ videoPath: string; thumbnailPath: string }> {
    await this.validateVideoDuration(filePath);
    const thumbnailPath = await this.generateVideoThumbnail(filePath);
    return { videoPath: filePath, thumbnailPath };
  }

  toPublicUrl(filePath: string): string {
    return '/' + filePath.replace(/\\/g, '/');
  }
}

export const mediaProcessingService = new MediaProcessingService();
