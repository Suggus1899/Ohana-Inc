import { Router } from 'express';
import { createRequest, getUserRequests, getReceivedRequests, getAllRentRequests, updateRequestStatus } from '../controllers/rent.controller';
import { authenticate, requireVerificationLevel, requireRole } from '../middleware/auth.middleware';
import { trackBehavior } from '../middleware/tracking.middleware';

const router = Router();

router.use(authenticate);

// Temporarily without KYC verification to allow P2P flow testing
// router.post('/', requireVerificationLevel(3), createRequest);
router.post('/', trackBehavior('request' as any), createRequest);

router.get('/', getUserRequests);
router.get('/all', requireRole(['admin', 'operator']), getAllRentRequests);
router.get('/received', getReceivedRequests);
router.patch('/:id/status', updateRequestStatus);

export default router;
