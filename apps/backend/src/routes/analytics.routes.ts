import { Router } from 'express';
import { getBehaviorDashboard, getConversionStats } from '../controllers/analytics.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['operator', 'admin']));

router.get('/dashboard', getBehaviorDashboard);
router.get('/conversion', getConversionStats);

export default router;
