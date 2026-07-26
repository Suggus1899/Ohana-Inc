import { Request, Response } from 'express';
import { exchangeRateService } from '../services/exchange-rate.service';

export const getExchangeRate = async (_req: Request, res: Response) => {
  try {
    const allRates = await exchangeRateService.getAllRates();
    const defaultRate = allRates.rates[allRates.defaultRate];

    res.json({
      success: true,
      data: {
        usdToCop: defaultRate.usdToCop,
        lastUpdated: defaultRate.lastUpdated,
        source: defaultRate.source,
        defaultRate: allRates.defaultRate,
        rates: allRates.rates,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXCHANGE_RATE_ERROR',
        message: 'Error al obtener la tasa de cambio',
      },
    });
  }
};

export const getAllRates = async (_req: Request, res: Response) => {
  try {
    const allRates = await exchangeRateService.getAllRates();
    res.json({
      success: true,
      data: allRates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXCHANGE_RATE_ERROR',
        message: 'Error al obtener las tasas de cambio',
      },
    });
  }
};
