import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getBadgeCounts
} from '../controllers/notification.controller';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.get('/badge-counts', authenticate, getBadgeCounts);
router.patch('/:id/read', authenticate, markAsRead);
router.post('/read-all', authenticate, markAllAsRead);
router.delete('/:id', authenticate, deleteNotification);

export default router;