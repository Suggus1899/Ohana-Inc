import { Router } from 'express';
import { handleResendWebhook } from '../controllers/webhook.controller';

const router = Router();

// POST /api/webhooks/resend
router.post('/resend', handleResendWebhook);

export default router;
