import { Router } from 'express';
import { googleAuth, googleAuthCallback } from '../controllers/auth-google.controller';
import { authenticate } from '../middleware/auth.middleware';
import { completeGoogleRegistration } from '../controllers/auth-google.controller';

const router = Router();

router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);
router.post('/google/complete', authenticate, completeGoogleRegistration);

export default router;
