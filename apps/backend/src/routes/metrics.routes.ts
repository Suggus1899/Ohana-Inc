import { Router } from 'express';
import {
  trackBatch,
  sessionStart,
  sessionEnd,
  behaviorSummary,
  trendingSearches,
  sessionFrequency
} from '../controllers/metrics.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// --- Cliente (recolección silenciosa) ---
router.post('/track-batch', trackBatch);
router.post('/session/start', authenticate, sessionStart);
router.put('/session/end', sessionEnd);

// --- Operador (solo lectura) ---
const operatorOnly = [authenticate, requireRole(['operator', 'admin'])];
router.get('/operator/behavior-summary', ...operatorOnly, behaviorSummary);
router.get('/operator/trending-searches', ...operatorOnly, trendingSearches);
router.get('/operator/session-frequency', ...operatorOnly, sessionFrequency);

export default router;