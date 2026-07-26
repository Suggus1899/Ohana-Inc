import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const IMAGES_DIR = 'uploads/properties/images';
const VIDEOS_DIR = 'uploads/properties/videos';
const THUMBNAILS_DIR = 'uploads/properties/thumbnails';

ensureDir(IMAGES_DIR);
ensureDir(VIDEOS_DIR);
ensureDir(THUMBNAILS_DIR);

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `img-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, VIDEOS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `vid-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

const imageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Formato de imagen no permitido: ${file.mimetype}. Use JPEG, PNG o WebP.`));
  }
};

const videoFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_VIDEO_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Formato de video no permitido: ${file.mimetype}. Use MP4 o MOV.`));
  }
};

const mixedFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.fieldname === 'images' && ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.fieldname === 'video' && ALLOWED_VIDEO_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Archivo no permitido: ${file.originalname}`));
  }
};

const mixedStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, VIDEOS_DIR);
    } else {
      cb(null, IMAGES_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const prefix = file.fieldname === 'video' ? 'vid' : 'img';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadImages = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
});

export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
});

export const uploadPropertyMedia = multer({
  storage: mixedStorage,
  fileFilter: mixedFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
}).fields([
  { name: 'images', maxCount: 20 },
  { name: 'video', maxCount: 1 },
]);

export const STORAGE_PATHS = {
  IMAGES_DIR,
  VIDEOS_DIR,
  THUMBNAILS_DIR,
};
