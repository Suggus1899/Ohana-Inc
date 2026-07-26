import { Router } from 'express';
import { createReport, getReports, updateReportStatus } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// POST /api/reports - Create a new user report
router.post('/', createReport);

// GET /api/reports - List all user reports
router.get('/', getReports);

// PATCH /api/reports/:id/status - Update report status (moderator only)
router.patch('/:id/status', updateReportStatus);

export default router;
