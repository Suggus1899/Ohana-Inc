import { Router } from 'express';
import { createVisit, getPropertyVisits, updateVisitStatus, getMyVisits, getOwnerVisits } from '../controllers/visit.controller';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', optionalAuth, createVisit);
router.get('/my', authenticate, getMyVisits);
router.get('/owner/all', authenticate, requireRole(['propietario', 'admin']), getOwnerVisits);
router.get('/:propertyId', authenticate, requireRole(['admin', 'propietario', 'operator']), getPropertyVisits);
router.patch('/:id/status', authenticate, requireRole(['admin', 'propietario', 'operator']), updateVisitStatus);

export default router;