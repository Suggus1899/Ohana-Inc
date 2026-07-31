import { Router } from 'express';
import { register, login, me, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimit, passwordResetRateLimit } from '../middleware/rate-limit.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, passwordResetRequestSchema, passwordResetConfirmSchema } from '../schemas/auth.schema';
import {
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  sendVerificationCode,
  verifyEmailCode
} from '../controllers/email-auth.controller';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);
router.get('/me', authenticate, me);

// Password reset
router.post('/request-password-reset', passwordResetRateLimit, validate(passwordResetRequestSchema), requestPasswordReset);
router.post('/verify-reset-code', passwordResetRateLimit, verifyResetCode);
router.post('/reset-password', passwordResetRateLimit, validate(passwordResetConfirmSchema), resetPassword);

// Email verification
router.post('/send-verification-code', authRateLimit, sendVerificationCode);
router.post('/verify-email', authRateLimit, verifyEmailCode);

// Logout
router.post('/logout', authenticate, logout);

export default router;
