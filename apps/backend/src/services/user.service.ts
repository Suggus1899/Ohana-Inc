import { User } from '../models';
import { UserRole } from '../types';

/**
 * Custom errors for user operations.
 * The controller maps these to appropriate HTTP status codes.
 */
export class UserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserValidationError';
  }
}

export class UserNotFoundError extends Error {
  constructor(message = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export class DuplicateUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateUserError';
  }
}

export class UserForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserForbiddenError';
  }
}

export interface CreateUserInput {
  name: string;
  email: string;
  phonePrefix?: string;
  phone: string;
  cedulaType: string;
  cedula: string;
  password: string;
  role: UserRole;
}

export class UserService {
  /**
   * Create a new user with validation, duplicate checking, and role validation.
   * Used by the admin user creation endpoint (POST /users).
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const { name, email, phonePrefix, phone, cedulaType, cedula, password, role } = input;

    // Basic field validation
    if (!name || !email || !phone || !cedula || !password || !role) {
      throw new UserValidationError('All fields are required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new UserValidationError('Invalid email format');
    }

    // Role validation
    const validRoles: UserRole[] = ['admin', 'cliente', 'operator', 'propietario', 'estudiante'];
    if (!validRoles.includes(role)) {
      throw new UserValidationError('Invalid role');
    }

    // Password length validation
    if (password.length < 6) {
      throw new UserValidationError('Password must be at least 6 characters');
    }

    // Duplicate email check
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new DuplicateUserError('Email already exists');
    }

    // Duplicate cedula check
    const fullCedula = `${cedulaType}-${cedula}`;
    const existingCedula = await User.findOne({ where: { cedula: fullCedula } });
    if (existingCedula) {
      throw new DuplicateUserError('Cedula already exists');
    }

    // Create user (beforeCreate hook hashes the password automatically)
    // Email is marked as verified because an admin is creating the account
    return User.create({
      name,
      email,
      phonePrefix: phonePrefix || '+57',
      phone,
      cedula: fullCedula,
      cedulaType,
      password,
      role,
      isVerified: false,
      emailVerified: true,
    } as any);
  }

  /**
   * Approve a user: set status to 'active' and mark as verified.
   */
  async approveUser(userId: string): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) throw new UserNotFoundError();

    user.accountStatus = 'active';
    user.isVerified = true;
    await user.save();
    return user;
  }

  /**
   * Reject a user: set status to 'rejected' and unverify.
   */
  async rejectUser(userId: string, reason?: string): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) throw new UserNotFoundError();

    user.accountStatus = 'rejected';
    user.isVerified = false;
    if (reason) user.statusReason = reason;
    await user.save();
    return user;
  }

  /**
   * Suspend a user: set status to 'suspended' with optional reason and expiry.
   * Prevents self-suspension.
   */
  async suspendUser(userId: string, requesterId: number, reason?: string, suspendedUntil?: string): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) throw new UserNotFoundError();

    if (requesterId === user.id) {
      throw new UserForbiddenError('Cannot suspend your own account');
    }

    user.accountStatus = 'suspended';
    if (reason) user.statusReason = reason;
    if (suspendedUntil) user.suspendedUntil = new Date(suspendedUntil);
    await user.save();
    return user;
  }

  /**
   * Reactivate a suspended or rejected user: set status back to 'active'.
   */
  async reactivateUser(userId: string, reason?: string): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) throw new UserNotFoundError();

    if (user.accountStatus !== 'suspended' && user.accountStatus !== 'rejected') {
      throw new UserValidationError('User is not suspended or blocked');
    }

    user.accountStatus = 'active';
    user.isVerified = true;
    user.statusReason = reason || null;
    await user.save();
    return user;
  }
}

export const userService = new UserService();
