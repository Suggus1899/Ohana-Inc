import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin', 'operator']));

router.get('/', getAuditLogs);

export default router;
