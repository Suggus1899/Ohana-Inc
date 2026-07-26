import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/settings - Obtener configuración (admin/operator)
router.get('/', requireRole(['admin', 'operator']), getSettings);

// PUT /api/settings - Actualizar configuración (admin only)
router.put('/', requireRole(['admin']), updateSettings);

export default router;
