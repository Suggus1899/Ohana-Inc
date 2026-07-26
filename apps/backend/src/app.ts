import dotenv from 'dotenv';
dotenv.config();
import express, { Application, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { setupPassport } from './services/passport.service';
import authRoutes from './routes/auth.routes';
import notificationRoutes from './routes/notification.routes';
import userRoutes from './routes/user.routes';
import propertyRoutes from './routes/property.routes';
import moderationRoutes from './routes/moderation.routes';
import ticketRoutes from './routes/ticket.routes';
import reportRoutes from './routes/report.routes';
import favoriteRoutes from './routes/favorite.routes';
import rentRoutes from './routes/rent.routes';
import taskRoutes from './routes/task.routes';
import kycRoutes from './routes/kyc.routes';
import transactionRoutes from './routes/transaction.routes';
import disputeRoutes from './routes/dispute.routes';
import chatRoutes from './routes/chat.routes';
//import { ApiResponse, ErrorCodes } from './types';
import exchangeRateRoutes from './routes/exchange-rate.routes';
import metricsRouter from './routes/metrics.routes';
import { ApiResponse, ErrorCodes } from './types';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import auditMiddleware from './middleware/audit.middleware';
import serviceRoutes from './routes/service.routes';
import analyticsRoutes from './routes/analytics.routes';
import statisticsRoutes from './routes/statistics.routes';
import auditRoutes from './routes/audit.routes';
import messageRoutes from './routes/message.routes';
import navigationRoutes from './routes/navigation.routes';
import announcementRoutes from './routes/announcement.routes';
import settingsRoutes from './routes/settings.routes';
import reviewRoutes from './routes/review.routes';
import webhookRoutes from './routes/webhook.routes';
import visitRoutes from './routes/visit.routes';
import googleAuthRoutes from './routes/auth-google.routes';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0].split(',')[0].trim();
  return req.socket.remoteAddress || req.ip || 'unknown';
}

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://habitasweb.me').trim();

const app: Application = express();

setupPassport();
app.use(passport.initialize());

console.log(`[CORS] FRONTEND_URL="${FRONTEND_URL}" (length=${FRONTEND_URL.length})`);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  if (!origin || origin === FRONTEND_URL || origin.toLowerCase().endsWith('.habitasweb.me') || origin === 'https://habitasweb.me' || origin === 'http://habitasweb.me') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-session-id');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
    return;
  }

  const ip = getClientIp(req);
  console.warn(`🚫 CORS | ${new Date().toISOString()} | ${ip} | ${origin}`);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  res.status(403).json({ success: false, error: { message: 'Not allowed by CORS' } });
});

app.use(express.json());

app.use(auditMiddleware);

// Serve uploaded files (images, videos)
app.use('/uploads', express.static('uploads'));

// Servir modelos face-api para el frontend
app.use('/models/face-api', express.static('models/face-api'));

// Servir archivos publicos (imagenes de perfiles, logos para correos)
app.use('/public', express.static('src/public'));

app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/rent-requests', rentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/exchange-rate', exchangeRateRoutes);
app.use('/api/metrics', metricsRouter);
app.use('/api/visits', visitRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler - debe estar después de todas las rutas
app.use(notFoundHandler);

// Error handler centralizado - debe estar al final
app.use(errorHandler);

export default app;
