import { Router } from 'express';
import { handleResendWebhook } from '../controllers/webhook.controller';
import { verifyResendWebhook } from '../middleware/webhook-auth.middleware';

const router = Router();

// POST /api/webhooks/resend
router.post('/resend', verifyResendWebhook, handleResendWebhook);

export default router;
