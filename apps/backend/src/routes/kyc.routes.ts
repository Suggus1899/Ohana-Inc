import { Router } from 'express';
import { startVerification, uploadDocument, processVerification, getVerificationStatus, getPendingVerifications, getVerificationDetails, approveVerification, rejectVerification, upload, gdprAccessData, gdprRectifyData, gdprDeleteData, gdprExportData, getMetrics, saveLevelProgress, completeLevel, getLevelProgress, viewDocument } from '../controllers/kyc.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/start', authenticate, startVerification);
router.post('/upload', authenticate, upload.single('file'), uploadDocument);
router.post('/process/:verificationId', authenticate, processVerification);
router.get('/status', authenticate, getVerificationStatus);

// Endpoints de niveles KYC
router.post('/level/save', authenticate, saveLevelProgress);
router.post('/level/complete', authenticate, completeLevel);
router.get('/level/progress', authenticate, getLevelProgress);

// Admin/Operator endpoints
router.get('/admin/pending', authenticate, requireRole(['operator', 'admin']), getPendingVerifications);
router.get('/admin/metrics', authenticate, requireRole(['operator', 'admin']), getMetrics);
router.get('/admin/:verificationId', authenticate, requireRole(['operator', 'admin']), getVerificationDetails);
router.post('/admin/approve/:verificationId', authenticate, requireRole(['operator', 'admin']), approveVerification);
router.post('/admin/reject/:verificationId', authenticate, requireRole(['operator', 'admin']), rejectVerification);
router.get('/admin/documents/:documentId/view', authenticate, requireRole(['operator', 'admin']), viewDocument);

// GDPR endpoints (Requisitos 31.6-31.10)
router.get('/gdpr/access', authenticate, gdprAccessData);
router.post('/gdpr/rectify', authenticate, gdprRectifyData);
router.post('/gdpr/delete', authenticate, gdprDeleteData);
router.get('/gdpr/export', authenticate, gdprExportData);

export default router;
