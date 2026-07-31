import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory: validates req.body against a Zod schema.
 *
 * On success, replaces req.body with the parsed (and coerced/transformed)
 * data. On failure, responds with 400 and field-level error details.
 *
 * Usage:
 *   router.post('/', validate(registerSchema), register);
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const flat = result.error.flatten();
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: flat.fieldErrors,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Middleware factory: validates req.query against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const flat = result.error.flatten();
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: flat.fieldErrors,
        },
      });
      return;
    }
    req.query = result.data as any;
    next();
  };
}

export { ZodError };
