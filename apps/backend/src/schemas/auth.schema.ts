import { z } from 'zod';

/**
 * Zod schemas for authentication request validation.
 *
 * These replace the manual validation in utils/validation.ts for the
 * auth routes, providing type-safe parsing with automatic error formatting.
 */

const cedulaTypeSchema = z.enum(['V', 'E', 'J', 'G'], {
  errorMap: () => ({ message: 'Invalid cedula type' }),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  phonePrefix: z.string().default('+57'),
  phone: z.string().min(1, 'Phone is required'),
  cedulaType: cedulaTypeSchema,
  cedula: z.string().min(1, 'Cedula is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  role: z.enum(['cliente', 'estudiante', 'propietario']).default('cliente'),
});
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
