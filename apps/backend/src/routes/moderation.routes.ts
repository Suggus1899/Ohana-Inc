import { Router } from 'express';
import * as moderationController from '../controllers/moderation.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Stats for the current moderator
router.get('/stats', authenticate, requireRole(['operator', 'admin']), moderationController.getModeratorStats);

// Global stats for admin dashboard
router.get('/admin/stats', authenticate, requireRole(['admin']), moderationController.getAdminStats);

export default router;
