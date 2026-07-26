/// <reference types="jest" />
import path from 'path';
import fs from 'fs';
import os from 'os';
import { MediaProcessingService } from '../src/services/media-processing.service';

jest.mock('sharp', () => {
  const sharpChain = {
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({ size: 1000 }),
  };
  return jest.fn(() => sharpChain);
});

jest.mock('fluent-ffmpeg', () => {
  const ffmpegMock = jest.fn().mockReturnValue({
    screenshots: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (this: any, event: string, cb: () => void) {
      if (event === 'end') setTimeout(cb, 0);
      return this;
    }),
  });
  (ffmpegMock as any).ffprobe = jest.fn();
  return ffmpegMock;
});

jest.mock('../src/config/storage.config', () => ({
  STORAGE_PATHS: {
    IMAGES_DIR: 'uploads/properties/images',
    VIDEOS_DIR: 'uploads/properties/videos',
    THUMBNAILS_DIR: 'uploads/properties/thumbnails',
  },
}));

describe('MediaProcessingService', () => {
  let service: MediaProcessingService;
  let tmpFile: string;

  beforeEach(() => {
    service = new MediaProcessingService();
    tmpFile = path.join(os.tmpdir(), `test-${Date.now()}.jpg`);
    fs.writeFileSync(tmpFile, Buffer.alloc(100));
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  // ─── processImage ──────────────────────────────────────────────────────

  describe('processImage', () => {
    it('genera imagen optimizada y thumbnail', async () => {
      const sharp = require('sharp');
      const chainMock = {
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue({ size: 500 }),
      };
      sharp.mockReturnValue(chainMock);

      const result = await service.processImage(tmpFile);

      expect(chainMock.toFile).toHaveBeenCalledTimes(2);
      expect(result.processedPath).toContain('-opt.webp');
      expect(result.thumbnailPath).toContain('-thumb.webp');
    });
  });

  // ─── getVideoDuration ─────────────────────────────────────────────────

  describe('getVideoDuration', () => {
    it('devuelve la duración correctamente', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe.mockImplementation((_: string, cb: Function) => {
        cb(null, { format: { duration: 90 } });
      });

      const duration = await service.getVideoDuration('test.mp4');

      expect(duration).toBe(90);
    });

    it('lanza error si ffprobe falla', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe.mockImplementation((_: string, cb: Function) => {
        cb(new Error('ffprobe failed'), null);
      });

      await expect(service.getVideoDuration('test.mp4')).rejects.toThrow('Error leyendo video');
    });
  });

  // ─── validateVideoDuration ────────────────────────────────────────────

  describe('validateVideoDuration', () => {
    it('no lanza error si el video dura menos de 2 minutos', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe.mockImplementation((_: string, cb: Function) => {
        cb(null, { format: { duration: 60 } });
      });

      const videoPath = path.join(os.tmpdir(), `test-vid-${Date.now()}.mp4`);
      fs.writeFileSync(videoPath, Buffer.alloc(10));

      await expect(service.validateVideoDuration(videoPath)).resolves.not.toThrow();
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    });

    it('lanza error y elimina el archivo si el video supera 2 minutos', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe.mockImplementation((_: string, cb: Function) => {
        cb(null, { format: { duration: 180 } });
      });

      const videoPath = path.join(os.tmpdir(), `test-long-vid-${Date.now()}.mp4`);
      fs.writeFileSync(videoPath, Buffer.alloc(10));

      await expect(service.validateVideoDuration(videoPath)).rejects.toThrow(
        'El video excede la duración máxima de 2 minutos'
      );

      expect(fs.existsSync(videoPath)).toBe(false);
    });

    it('incluye la duración real en el mensaje de error', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe.mockImplementation((_: string, cb: Function) => {
        cb(null, { format: { duration: 150 } });
      });

      const videoPath = path.join(os.tmpdir(), `test-150-${Date.now()}.mp4`);
      fs.writeFileSync(videoPath, Buffer.alloc(10));

      await expect(service.validateVideoDuration(videoPath)).rejects.toThrow('150s');
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    });
  });

  // ─── toPublicUrl ──────────────────────────────────────────────────────

  describe('toPublicUrl', () => {
    it('convierte path a URL pública con slashes correctos', () => {
      const url = service.toPublicUrl('uploads\\properties\\images\\img-1.webp');
      expect(url).toBe('/uploads/properties/images/img-1.webp');
    });

    it('maneja paths Unix sin cambio', () => {
      const url = service.toPublicUrl('uploads/properties/images/img-1.webp');
      expect(url).toBe('/uploads/properties/images/img-1.webp');
    });
  });
});
