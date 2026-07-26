import { Router } from 'express';
import { 
  getUsers,
  getUserById, 
  createUser,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
  verifyUser,
  updateUserRole,
  updateUserStatus,
  getPaymentInfo,
  updatePaymentInfo,
  getMyVerificationLevel,
  updateProfile,
  changePassword,
  updatePreferences,
  markTutorialCompleted,
  getStudents,
} from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Current user routes (must be before /:id to avoid param capture)
router.get('/me/verification-level', getMyVerificationLevel);
router.put('/me/profile', updateProfile);
router.put('/me/password', changePassword);
router.put('/me/preferences', updatePreferences);
router.put('/me/tutorial-completed', markTutorialCompleted);
router.patch('/me/payment-info', updatePaymentInfo);
router.get('/me/payment-info', getPaymentInfo);
router.get('/:id/payment-info', requireRole(['admin']), getPaymentInfo);

// Owner - view students/clients
router.get('/students', getStudents);

// Admin and Operator routes
router.get('/', requireRole(['admin', 'operator']), getUsers);
router.get('/:id', getUserById);
router.patch('/:id/verify', requireRole(['admin', 'operator']), verifyUser);
router.patch('/:id/status', requireRole(['admin', 'operator']), updateUserStatus);

// User status management (admin and operator)
router.patch('/:id/approve', requireRole(['admin', 'operator']), approveUser);
router.patch('/:id/reject', requireRole(['admin', 'operator']), rejectUser);
router.patch('/:id/suspend', requireRole(['admin', 'operator']), suspendUser);
router.patch('/:id/reactivate', requireRole(['admin', 'operator']), reactivateUser);

// Admin ONLY routes
router.post('/', requireRole(['admin']), createUser);
router.put('/:id', requireRole(['admin']), updateUser);
router.delete('/:id', requireRole(['admin']), deleteUser);
router.patch('/:id/role', requireRole(['admin']), updateUserRole);

export default router;
