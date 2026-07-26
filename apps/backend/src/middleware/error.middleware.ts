import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorCodes } from '../types';
import { LivenessError } from '../errors/liveness-errors';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, string>;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: Record<string, string>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super(message, 400, ErrorCodes.VALIDATION_ERROR, details);
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado') {
    super(message, 401, ErrorCodes.UNAUTHORIZED);
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'No tienes permisos para realizar esta acción') {
    super(message, 403, ErrorCodes.FORBIDDEN);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404, ErrorCodes.NOT_FOUND);
  }
}

/**
 * Processing Error (422)
 */
export class ProcessingError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super(message, 422, 'PROCESSING_ERROR', details);
  }
}

/**
 * Centralized error handling middleware
 * 
 * Requisitos: 22.8-22.13
 * 
 * Mapea errores a códigos HTTP apropiados:
 * - Validación: 400
 * - Autenticación: 401
 * - Autorización: 403
 * - No encontrado: 404
 * - Procesamiento: 422
 * - Internos: 500 (sin exponer detalles)
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Si ya se envió la respuesta, delegar al manejador por defecto
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[ERROR] ${err.message}`);

  // Si es un error operacional conocido (AppError)
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString()
      }
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Manejar errores de liveness detection (Requirements: 10.1, 10.2, 10.3, 10.4)
  if (err instanceof LivenessError) {
    // Ocultar detalles técnicos en producción
    const details = process.env.NODE_ENV === 'production' 
      ? undefined 
      : err.details;

    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details,
        timestamp: new Date().toISOString()
      }
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Manejar errores de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const details: Record<string, string> = {};
    if ('errors' in err && Array.isArray((err as any).errors)) {
      (err as any).errors.forEach((e: any) => {
        details[e.path] = e.message;
      });
    }
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Error de validación',
        details,
        timestamp: new Date().toISOString()
      }
    };
    res.status(400).json(response);
    return;
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.DUPLICATE_ENTRY,
        message: 'El registro ya existe',
        timestamp: new Date().toISOString()
      }
    };
    res.status(400).json(response);
    return;
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Referencia inválida',
        timestamp: new Date().toISOString()
      }
    };
    res.status(400).json(response);
    return;
  }

  // Manejar errores de Multer (upload de archivos)
  if (err.name === 'MulterError') {
    let message = 'Error al subir archivo';
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      message = 'El archivo es demasiado grande. Tamaño máximo: 10MB';
    }
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message,
        timestamp: new Date().toISOString()
      }
    };
    res.status(400).json(response);
    return;
  }

  // Error interno del servidor (500)
  // NO exponer detalles del error en producción
  const response: ApiResponse = {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'Error interno del servidor' 
        : err.message,
      timestamp: new Date().toISOString()
    }
  };
  res.status(500).json(response);
}

/**
 * Middleware para manejar rutas no encontradas (404)
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: ErrorCodes.NOT_FOUND,
      message: `Ruta no encontrada: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    }
  };
  res.status(404).json(response);
}
