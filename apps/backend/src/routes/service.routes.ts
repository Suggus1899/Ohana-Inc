import { Router } from 'express';
import { getServices, createService, updateService } from '../controllers/service.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getServices);

// Protected routes (Admin/Operator ONLY for management)
router.use(authenticate);
router.post('/', requireRole(['admin', 'operator']), createService);
router.put('/:id', requireRole(['admin', 'operator']), updateService);
router.patch('/:id', requireRole(['admin', 'operator']), updateService);

export default router;
