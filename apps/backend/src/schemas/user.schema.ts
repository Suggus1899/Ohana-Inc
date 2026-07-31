import { z } from 'zod';

/**
 * Zod schemas for user management request validation.
 */

const cedulaTypeSchema = z.enum(['V', 'E', 'J', 'G'], {
  errorMap: () => ({ message: 'Invalid cedula type' }),
});

const userRoleSchema = z.enum(['admin', 'cliente', 'operator', 'propietario', 'estudiante']);

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  phonePrefix: z.string().default('+57'),
  phone: z.string().min(1, 'Phone is required'),
  cedulaType: cedulaTypeSchema,
  cedula: z.string().min(1, 'Cedula is required'),
  role: userRoleSchema,
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phonePrefix: z.string().optional(),
  phone: z.string().optional(),
  cedulaType: cedulaTypeSchema.optional(),
  cedula: z.string().optional(),
  role: userRoleSchema.optional(),
  accountStatus: z.enum(['active', 'suspended', 'rejected', 'pending']).optional(),
  isVerified: z.boolean().optional(),
}).strict();

export const suspendUserSchema = z.object({
  reason: z.string().max(500).optional(),
  suspendedUntil: z.string().datetime().optional(),
}).strict();

export const rejectUserSchema = z.object({
  reason: z.string().max(500).optional(),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
