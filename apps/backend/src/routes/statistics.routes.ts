import { Router } from 'express';
import { getStatisticsOverview, getStatisticsTrends, getPropertyTypeCounts, getServicePropertyCounts } from '../controllers/statistics.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['operator', 'admin']));

router.get('/overview', getStatisticsOverview);
router.get('/trends', getStatisticsTrends);
router.get('/property-type-counts', getPropertyTypeCounts);
router.get('/service-property-counts', getServicePropertyCounts);

export default router;
