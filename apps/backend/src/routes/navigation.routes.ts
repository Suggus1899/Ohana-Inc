import { Router } from 'express';
import * as navigationController from '../controllers/navigation.controller';

const router = Router();

// Route calculation
router.post('/route', navigationController.calculateRoute);

// Geocoding (optional)
router.get('/geocode', navigationController.geocode);

export default router;
