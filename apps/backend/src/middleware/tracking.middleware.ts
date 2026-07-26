import { Response, NextFunction } from 'express';
import { UserBehavior } from '../models';
import { AuthRequest } from '../types';

const SENSITIVE_BODY_KEYS = new Set([
  'password', 'token', 'secret', 'creditCard', 'cardNumber', 'cvv',
  'bankAccountNumber', 'bankAccountHolder', 'paymentReference',
]);

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return undefined;
  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(body)) {
    if (SENSITIVE_BODY_KEYS.has(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = body[key];
    }
  }
  return sanitized;
}

export const trackBehavior = (eventType: 'search' | 'view' | 'click' | 'filter' | 'favorite' | 'request' | 'geocode_search' | 'nearby_search' | 'autocomplete' | 'reverse_geocode') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || null;
      const sessionId = req.headers['x-session-id'] as string || 'anonymous';

      // We don't wait for the creation to finish to not block the request
      UserBehavior.create({
        userId,
        sessionId,
        eventType,
        eventData: {
          path: req.path,
          query: req.query,
          body: req.method === 'POST' ? sanitizeBody(req.body) : undefined,
          userAgent: req.headers['user-agent']
        },
        timestamp: new Date()
      }).catch(err => console.error('Tracking error:', err));

      next();
    } catch (error) {
      // Never block the main flow for tracking errors
      next();
    }
  };
};
