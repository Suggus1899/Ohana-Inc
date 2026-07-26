import { RequestHandler, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwt.service';
import { AuthRequest, ApiResponse, ErrorCodes, UserRole, JWTPayload } from '../types';
import { UserSession } from '../models';

export { AuthRequest };

export const authenticate: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'No token provided'
        }
      };
      res.status(401).json(response);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as JWTPayload | null;

    if (!decoded) {
      const response: ApiResponse = {
        success: false,
        error: { code: ErrorCodes.UNAUTHORIZED, message: 'Invalid or expired token' }
      };
      res.status(401).json(response);
      return;
    }

    // Verify session is still active
    const session = await UserSession.findOne({
      where: { userId: decoded.userId, endedAt: null }
    });
    if (!session) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'SESSION_EXPIRED', message: 'Tu sesión ha expirado. Inicia sesión nuevamente.' }
      };
      res.status(401).json(response);
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: { code: ErrorCodes.UNAUTHORIZED, message: 'Authentication failed' }
    };
    res.status(401).json(response);
  }
};

export const optionalAuth: RequestHandler = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token) as JWTPayload | null;
      if (decoded) {
        req.user = decoded;
      }
    }
    next();
  } catch {
    next();
  }
};

export const requireRole = (allowedRoles: UserRole[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' }
      };
      res.status(401).json(response);
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      const response: ApiResponse = {
        success: false,
        error: { code: ErrorCodes.FORBIDDEN, message: 'Insufficient permissions' }
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};

export const requireVerificationLevel = (minLevel: number): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' }
      };
      res.status(401).json(response);
      return;
    }

    const userLevel = (req.user.verificationLevel ?? 0) as number;

    if (userLevel < minLevel) {
      const levelNames: Record<number, string> = {
        0: 'Sin verificar',
        1: 'Email verificado',
        2: 'Documentos enviados',
        3: 'Documentos aprobados',
        4: 'Biometría aprobada',
        5: 'Completamente verificado'
      };

      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: `Verification level ${minLevel} (${levelNames[minLevel] ?? 'N/A'}) required. Your current level is ${userLevel} (${levelNames[userLevel] ?? 'N/A'}).`
        }
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};
