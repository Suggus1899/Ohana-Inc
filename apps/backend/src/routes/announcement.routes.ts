import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
} from '../controllers/announcement.controller';

const router = Router();

router.get('/', authenticate, requireRole(['admin', 'operator']), getAnnouncements);
router.post('/', authenticate, requireRole(['admin']), createAnnouncement);
router.patch('/:id', authenticate, requireRole(['admin']), updateAnnouncement);
router.delete('/:id', authenticate, requireRole(['admin']), deleteAnnouncement);
router.post('/:id/publish', authenticate, requireRole(['admin']), publishAnnouncement);

export default router;
