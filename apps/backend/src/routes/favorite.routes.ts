import { Router } from 'express';
import { toggleFavorite, getUserFavorites } from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth.middleware';
import { trackBehavior } from '../middleware/tracking.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getUserFavorites);
router.post('/toggle', trackBehavior('favorite' as any), toggleFavorite);

export default router;
