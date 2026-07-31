import { Request, Response } from 'express';
import { User, RentalRequest, Property, PropertyAssignment, UserSession } from '../models';
import { Op } from 'sequelize';
import { AuthRequest, ApiResponse, ErrorCodes, UserRole, AccountStatus } from '../types';
import { userService, UserValidationError, UserNotFoundError, DuplicateUserError, UserForbiddenError } from '../services/user.service';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, excludeRole, accountStatus, isVerified, verifiedById, search, page = 1, limit = 10 } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (excludeRole) where.role = { [Op.ne]: excludeRole };
    if (accountStatus) where.accountStatus = accountStatus;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';
    if (verifiedById) where.verifiedById = Number(verifiedById);

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { cedula: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      offset,
      limit: Number(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' }
      });
    }

    if (req.user?.userId === user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No puedes eliminar tu propia cuenta' }
      });
    }

    await (user as any).destroy();

    res.json({
      success: true,
      data: { message: 'Usuario eliminado correctamente' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autenticado' },
      });
    }

    const ownerProperties = await Property.findAll({
      where: { authorId: ownerId },
      attributes: ['id'],
      paranoid: false,
    });
    const propertyIds = ownerProperties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return res.json({ success: true, data: { users: [] } });
    }

    // Fetch related user IDs via parameterized queries (safe against injection)
    const tenantRows = await RentalRequest.findAll({
      where: { propertyId: { [Op.in]: propertyIds } },
      attributes: ['tenantId'],
      group: ['tenantId'],
      raw: true,
    });
    const clientRows = await PropertyAssignment.findAll({
      where: { propertyId: { [Op.in]: propertyIds } },
      attributes: ['clientId'],
      group: ['clientId'],
      raw: true,
    });
    const relatedUserIds = [
      ...new Set([
        ...tenantRows.map((r) => r.tenantId),
        ...clientRows.map((r) => r.clientId),
      ]),
    ];

    if (relatedUserIds.length === 0) {
      return res.json({ success: true, data: { users: [] } });
    }

    const users = await User.findAll({
      where: {
        role: { [Op.in]: ['estudiante', 'cliente'] },
        id: { [Op.in]: relatedUserIds },
      },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: RentalRequest,
          as: 'rentalRequests',
          required: false,
          where: { propertyId: { [Op.in]: propertyIds } },
          include: [
            {
              model: Property,
              as: 'property',
              attributes: ['id', 'title', 'address', 'price', 'images', 'type'],
            },
          ],
        },
        {
          model: PropertyAssignment,
          as: 'propertyAssignments',
          required: false,
          where: { propertyId: { [Op.in]: propertyIds } },
          include: [
            {
              model: Property,
              as: 'property',
              attributes: ['id', 'title', 'address', 'price', 'images', 'type'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: { users } });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message },
    });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requestedId = Number(id);
    const isSelf = req.user?.userId === requestedId;
    const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'operator';

    // Public profile fields visible to anyone; full profile only to self or admin/operator
    const attributes: { exclude: string[] } = { exclude: ['password'] };

    const user = await User.findByPk(id, { attributes });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    // Non-privileged users requesting another user's profile get limited fields
    if (!isSelf && !isPrivileged) {
      const publicFields = user.toJSON();
      const limited = {
        id: publicFields.id,
        name: publicFields.name,
        role: publicFields.role,
        isVerified: publicFields.isVerified,
        profilePhotoUrl: publicFields.profilePhotoUrl,
        phonePrefix: publicFields.phonePrefix,
        phone: publicFields.phone,
      };
      return res.json({ success: true, data: { user: limited } });
    }

    res.json({
      success: true,
      data: { user: user.toJSON() }
    });
  } catch (error: any) {
    console.error('getUserById error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await userService.createUser(req.body as any);
    res.status(201).json({
      success: true,
      data: { user: user.toJSON(), message: 'User created successfully' },
    });
  } catch (error) {
    if (error instanceof DuplicateUserError) {
      res.status(409).json({ success: false, error: { code: ErrorCodes.DUPLICATE_ENTRY, message: error.message } });
      return;
    }
    if (error instanceof UserValidationError) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.VALIDATION_ERROR, message: error.message } });
      return;
    }
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'An error occurred while creating user' } });
  }
}

// Approve user (set status to 'active')
export async function approveUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await userService.approveUser(req.params.id);
    res.status(200).json({ success: true, data: { user: user.toJSON(), message: 'User approved successfully' } });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.NOT_FOUND, message: error.message } });
      return;
    }
    console.error('Approve user error:', error);
    res.status(500).json({ success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'An error occurred while approving user' } });
  }
}

// Reject user (set status to 'rejected')
export async function rejectUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { reason } = req.body;
    const user = await userService.rejectUser(req.params.id, reason);
    res.status(200).json({
      success: true,
      data: { user: user.toJSON(), message: 'User rejected successfully', reason: reason || 'No reason provided' },
    });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.NOT_FOUND, message: error.message } });
      return;
    }
    console.error('Reject user error:', error);
    res.status(500).json({ success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'An error occurred while rejecting user' } });
  }
}

// Suspend user (set status to 'suspended')
export async function suspendUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { reason, suspendedUntil } = req.body;
    const user = await userService.suspendUser(req.params.id, req.user!.userId, reason, suspendedUntil);
    res.status(200).json({
      success: true,
      data: { user: user.toJSON(), message: 'User suspended successfully', reason: reason || 'No reason provided' },
    });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.NOT_FOUND, message: error.message } });
      return;
    }
    if (error instanceof UserForbiddenError) {
      res.status(403).json({ success: false, error: { code: ErrorCodes.FORBIDDEN, message: error.message } });
      return;
    }
    console.error('Suspend user error:', error);
    res.status(500).json({ success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'An error occurred while suspending user' } });
  }
}

// Reactivate suspended/rejected user (set status to 'active')
export async function reactivateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { reason } = req.body;
    const user = await userService.reactivateUser(req.params.id, reason);
    res.status(200).json({ success: true, data: { user: user.toJSON(), message: 'User reactivated successfully' } });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ success: false, error: { code: ErrorCodes.NOT_FOUND, message: error.message } });
      return;
    }
    if (error instanceof UserValidationError) {
      res.status(400).json({ success: false, error: { code: ErrorCodes.VALIDATION_ERROR, message: error.message } });
      return;
    }
    console.error('Reactivate user error:', error);
    res.status(500).json({ success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'An error occurred while reactivating user' } });
  }
}

// Actualizar usuario completo
export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phonePrefix,
      phone,
      cedulaType,
      cedula,
      role,
      password // Opcional: solo si se quiere cambiar
    } = req.body;

    // Buscar usuario
    const user = await User.findByPk(id);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'User not found'
        }
      };
      res.status(404).json(response);
      return;
    }

    // Validaciones básicas
    if (!name || !email || !phone || !cedula || !role) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'All fields are required'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Invalid email format'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Validar rol
    const validRoles: UserRole[] = ['admin', 'cliente', 'operator', 'propietario', 'estudiante'];
    if (!validRoles.includes(role)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Invalid role'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Verificar si el email ya existe (excluyendo el usuario actual)
    if (email !== user.email) {
      const existingEmail = await User.findOne({ 
        where: { 
          email,
          id: { [require('sequelize').Op.ne]: id }
        } 
      });
      if (existingEmail) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: ErrorCodes.DUPLICATE_ENTRY,
            message: 'Email already exists'
          }
        };
        res.status(409).json(response);
        return;
      }
    }

    // Verificar si la cédula ya existe (excluyendo el usuario actual)
    const fullCedula = `${cedulaType}-${cedula}`;
    if (fullCedula !== user.cedula) {
      const existingCedula = await User.findOne({ 
        where: { 
          cedula: fullCedula,
          id: { [require('sequelize').Op.ne]: id }
        } 
      });
      if (existingCedula) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: ErrorCodes.DUPLICATE_ENTRY,
            message: 'Cedula already exists'
          }
        };
        res.status(409).json(response);
        return;
      }
    }

    // Prevenir que el admin cambie su propio rol
    if (req.user?.userId === user.id && role !== user.role) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'Cannot change your own role'
        }
      };
      res.status(403).json(response);
      return;
    }

    // Validar contraseña si se proporciona
    if (password && password.length < 6) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Password must be at least 6 characters'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Actualizar campos
    user.name = name;
    user.email = email;
    user.phonePrefix = phonePrefix || '+57';
    user.phone = phone;
    user.cedula = fullCedula;
    user.cedulaType = cedulaType;
    user.role = role;

    // Solo actualizar contraseña si se proporciona
    if (password) {
      user.password = password; // El hook beforeUpdate la hasheará automáticamente
    }

    await user.save();

    const response: ApiResponse = {
      success: true,
      data: {
        user: user.toJSON(),
        message: 'User updated successfully'
      }
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Update user error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'An error occurred while updating user'
      }
    };
    res.status(500).json(response);
  }
}


export const verifyUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    const authReq = req as AuthRequest;
    const moderatorId = Number(authReq.user?.userId);

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    await user.update({ 
      isVerified,
      verifiedById: moderatorId
    });

    res.json({
      success: true,
      data: { user: user.toJSON() }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'VERIFY_ERROR', message: error.message }
    });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'cliente', 'operator', 'propietario', 'estudiante'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Invalid role' }
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    await user.update({ role });

    res.json({
      success: true,
      data: { user: user.toJSON() }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'blocked', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid status' }
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    await user.update({ status });

    res.json({
      success: true,
      data: { user: user.toJSON() }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

const PAYMENT_FIELDS = [
  'bankName', 'bankAccountNumber', 'bankAccountHolder', 'bankAccountType',
  'bankPhone', 'bankPhoneId', 'bankPhoneName',
] as const;

export const getPaymentInfo = async (req: AuthRequest, res: Response) => {
  try {
    // /me/payment-info has no :id param; /:id/payment-info is admin-only (enforced by route)
    const id = req.params.id || String(req.user?.userId);
    if (!id) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
    }
    const user = await User.findByPk(id, {
      attributes: ['name', ...PAYMENT_FIELDS],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const data = user.toJSON() as any;
    res.json({
      success: true,
      data: {
        name: data.name,
        paymentInfo: {
          bankName: data.bankName ?? null,
          bankAccountNumber: data.bankAccountNumber ?? null,
          bankAccountHolder: data.bankAccountHolder ?? null,
          bankAccountType: data.bankAccountType ?? null,
          bankPhone: data.bankPhone ?? null,
          bankPhoneId: data.bankPhoneId ?? null,
          bankPhoneName: data.bankPhoneName ?? null,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message },
    });
  }
};

export const updatePaymentInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const updateData: Record<string, any> = {};
    for (const field of PAYMENT_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    await user.update(updateData);

    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message },
    });
  }
};

export const getMyVerificationLevel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'verificationLevel', 'isVerified', 'role'],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const data = user.toJSON() as any;
    res.json({
      success: true,
      data: {
        verificationLevel: data.verificationLevel || 0,
        isVerified: data.isVerified || false,
        canRequestProperty: (data.verificationLevel || 0) >= 2,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message },
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autorizado' }
      });
    }

    const { name, phone, dateOfBirth, gender } = req.body;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' }
      });
    }

    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(gender !== undefined && { gender }),
    });

    res.json({
      success: true,
      data: { user: { id: user.id, name: user.name, phone: user.phone, dateOfBirth: user.dateOfBirth, gender: user.gender } }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

// Change current user password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autorizado' }
      });
    }

    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcryptjs');
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' }
      });
    }

    // If user has an existing password, verify current password
    if (user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PASSWORD', message: 'Contraseña actual incorrecta' }
        });
      }
    }

    // Let the beforeUpdate hook handle hashing (don't hash here)
    await user.update({ password: newPassword });

    // Cerrar todas las sesiones activas para forzar re-login con la nueva contraseña
    await UserSession.update(
      { endedAt: new Date() },
      { where: { userId: user.id, endedAt: null } }
    );

    res.json({
      success: true,
      data: { message: 'Contraseña actualizada correctamente' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

// Update user notification preferences
export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autorizado' }
      });
    }

    const { emailNotifications, whatsappNotifications } = req.body;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' }
      });
    }

    await user.update({
      preferences: {
        emailNotifications: emailNotifications ?? user.preferences?.emailNotifications ?? true,
        whatsappNotifications: whatsappNotifications ?? user.preferences?.whatsappNotifications ?? false,
      }
    });

    res.json({
      success: true,
      data: { preferences: user.preferences }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

export const markTutorialCompleted = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autorizado' }
      });
    }

    await User.update({ tutorialCompleted: true }, { where: { id: userId } });

    res.json({
      success: true,
      data: { message: 'Tutorial marcado como completado' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};
