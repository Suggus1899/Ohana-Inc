import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import multer from 'multer';
import {
  createDispute,
  resolveDispute,
  markUnderReview,
  getPendingDisputes,
  getDisputeDetails,
  getMyDisputes,
} from '../controllers/dispute.controller';

const router = Router();

// Configurar multer para evidencias
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/dispute-evidence/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'evidence-' + uniqueSuffix + '-' + file.originalname);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes y PDFs.'));
    }
  },
});

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener mis disputas
router.get('/my', getMyDisputes);

// Obtener disputas pendientes (admin/operator)
router.get('/pending', requireRole(['admin', 'operator']), getPendingDisputes);

// Obtener detalle de disputa
router.get('/:id', getDisputeDetails);

// Crear disputa
router.post('/', upload.array('evidence', 5), createDispute);

// Marcar como bajo revisión (admin/operator)
router.post('/:id/review', requireRole(['admin', 'operator']), markUnderReview);

// Resolver disputa (admin/operator)
router.post('/:id/resolve', requireRole(['admin', 'operator']), resolveDispute);

export default router;
