import rateLimit from 'express-rate-limit';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

// Generic auth rate limiter: 5 requests per 15 minutes per IP
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

// Stricter rate limiter for password reset: 3 requests per 15 minutes per IP
export const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts. Please try again later.',
    },
  },
});

// Metrics tracking rate limiter: 30 requests per minute per IP
export const metricsRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many tracking requests.',
    },
  },
});
