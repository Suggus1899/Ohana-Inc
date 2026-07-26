import { Router } from 'express';
import { register, login, me, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  sendVerificationCode,
  verifyEmailCode
} from '../controllers/email-auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);

// Password reset
router.post('/request-password-reset', requestPasswordReset);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

// Email verification
router.post('/send-verification-code', sendVerificationCode);
router.post('/verify-email', verifyEmailCode);

// Logout
router.post('/logout', authenticate, logout);

export default router;
