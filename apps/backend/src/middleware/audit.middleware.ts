import { Request, Response, NextFunction } from 'express';
import Auditoria from '../models/Auditoria';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || 'unknown';
}

const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    Auditoria.create({
      ip_address: getClientIp(req),
      origin: req.headers['origin'] as string | null,
      host: req.headers['host'] as string | null,
      user_agent: req.headers['user-agent'] as string | null,
      method: req.method,
      path: req.originalUrl || req.url,
      status_code: res.statusCode,
      created_at: new Date(),
    }).catch(() => {});
  });

  next();
};

export default auditMiddleware;
