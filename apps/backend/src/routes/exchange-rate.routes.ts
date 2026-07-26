import { Router } from 'express';
import { getExchangeRate, getAllRates } from '../controllers/exchange-rate.controller';

const router = Router();

// GET /api/exchange-rate - Get current USD → COP rate (default)
router.get('/', getExchangeRate);

// GET /api/exchange-rate/all - Get all exchange rates
router.get('/all', getAllRates);

export default router;
