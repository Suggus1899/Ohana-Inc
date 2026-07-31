import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User, UserSession } from '../models';
import { generateToken } from '../services/jwt.service';
import { validateRegisterInput, validateLoginInput } from '../utils/validation';
import { ApiResponse, ErrorCodes, AuthRequest } from '../types';


export async function register(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateRegisterInput(req.body);
    
    if (!validation.isValid) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Por favor, corrige los siguientes errores:',
          details: validation.errors.reduce((acc, err) => {
            acc[err.field] = err.message;
            return acc;
          }, {} as Record<string, string>)
        }
      };
      res.status(400).json(response);
      return;
    }

    const { name, email: rawEmail, password, phonePrefix, phone, cedulaType, cedula, dateOfBirth, gender, role } = req.body;

    // Normalizar email a minúsculas para evitar duplicados con Google (que siempre da minúsculas)
    const email = rawEmail ? rawEmail.toLowerCase().trim() : rawEmail;

    // Self-registration is restricted to end-user roles only.
    // 'admin' and 'operator' accounts must be created by an existing admin
    // via the authenticated user creation endpoint (POST /users).
    const ALLOWED_ROLES = ['cliente', 'estudiante', 'propietario'];
    let userRole = 'cliente'; // Default role
    
    if (role && ALLOWED_ROLES.includes(role)) {
      userRole = role;
    }

    // Check for duplicate email or cedula
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email },
          { cedula }
        ]
      } 
    });
    
    if (existingUser) {
      const isDuplicateEmail = existingUser.email === email;
      const field = isDuplicateEmail ? 'email' : 'cedula';
      const msg = isDuplicateEmail 
        ? 'Ya existe una cuenta con este correo electrónico. ¿Deseas iniciar sesión?'
        : 'Ya existe una cuenta con este número de cédula. Si es tu cuenta, intenta iniciar sesión.';
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.DUPLICATE_EMAIL,
          message: msg,
          details: { [field]: msg }
        }
      };
      res.status(409).json(response);
      return;
    }

    // Create user with selected or default role
    const user = await User.create({
      name,
      email,
      password,
      phonePrefix,
      phone,
      cedulaType,
      cedula,
      dateOfBirth,
      gender,
      role: userRole as 'cliente' | 'operator' | 'admin' | 'estudiante' | 'propietario',
      isVerified: false
    });

    const response: ApiResponse = {
      success: true,
      data: {
        user: user.toJSON()
      }
    };
    res.status(201).json(response);
  } catch (error: any) {
    console.error('Register error:', error);
    
    // Handle PostgreSQL unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'field';
      const fieldNames: Record<string, string> = {
        email: 'correo electrónico',
        cedula: 'número de cédula',
        phone: 'número de teléfono'
      };
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.DUPLICATE_EMAIL,
          message: `Ya existe una cuenta con este ${fieldNames[field] || field}. Por favor, verifica tus datos o intenta iniciar sesión.`
        }
      };
      res.status(409).json(response);
      return;
    }
    
    // Handle PostgreSQL validation errors
    if (error.name === 'SequelizeValidationError') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Los datos ingresados no son válidos. Por favor, revisa el formulario.',
          details: error.errors.reduce((acc: any, err: any) => {
            acc[err.path] = err.message;
            return acc;
          }, {})
        }
      };
      res.status(400).json(response);
      return;
    }
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Ocurrió un error al crear tu cuenta. Por favor, intenta nuevamente en unos momentos.'
      }
    };
    res.status(500).json(response);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateLoginInput(req.body);
    
    if (!validation.isValid) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Por favor, corrige los siguientes errores:',
          details: validation.errors.reduce((acc, err) => {
            acc[err.field] = err.message;
            return acc;
          }, {} as Record<string, string>)
        }
      };
      res.status(400).json(response);
      return;
    }

    const { email: rawEmail, password } = req.body;

    // Normalizar email a minúsculas para consistencia con Google auth y register
    const email = rawEmail ? rawEmail.toLowerCase().trim() : rawEmail;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.INVALID_CREDENTIALS,
          message: 'Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente.'
        }
      };
      res.status(401).json(response);
      return;
    }

    // Check if user registered with Google and never set a password
    if (!user.password) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'USE_GOOGLE_AUTH',
          message: 'Esta cuenta no tiene contraseña. Inicia sesión con Google o configura una contraseña en tu perfil.'
        }
      };
      res.status(400).json(response);
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.INVALID_CREDENTIALS,
          message: 'Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente.'
        }
      };
      res.status(401).json(response);
      return;
    }

    // Check account status
    if (user.accountStatus === 'suspended') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.ACCOUNT_SUSPENDED,
          message: 'Tu cuenta ha sido suspendida. Por favor, contacta al soporte para más información.'
        }
      };
      res.status(403).json(response);
      return;
    }

    if (user.accountStatus === 'rejected') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.ACCOUNT_REJECTED,
          message: 'Tu solicitud de cuenta fue rechazada. Por favor, contacta al soporte para más información.'
        }
      };
      res.status(403).json(response);
      return;
    }

    // Check email verification (traditional registration requires email verification)
    if (!user.emailVerified) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.EMAIL_NOT_VERIFIED,
          message: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
        }
      };
      res.status(403).json(response);
      return;
    }

    // Single session: cerrar sesión anterior si existe (permitir re-login desde cualquier dispositivo)
    await UserSession.update(
      { endedAt: new Date() },
      { where: { userId: user.id, endedAt: null } }
    );

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      verificationLevel: user.verificationLevel ?? 0
    });

    const response: ApiResponse = {
      success: true,
      data: {
        user: user.toJSON(),
        token
      }
    };

    // Create new session record
    await UserSession.create({ userId: user.id, startedAt: new Date() });

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Ocurrió un error al iniciar sesión. Por favor, intenta nuevamente en unos momentos.'
      }
    };
    res.status(500).json(response);
  }
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Not authenticated'
        }
      };
      res.status(401).json(response);
      return;
    }

    const user = await User.findByPk(req.user.userId);
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

    const userJson = user.toJSON() as any;
    userJson.hasPassword = !!user.password;
    userJson.tutorialCompleted = user.tutorialCompleted;

    const response: ApiResponse = {
      success: true,
      data: {
        user: userJson
      }
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Me error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'An error occurred'
      }
    };
    res.status(500).json(response);
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    await UserSession.update(
      { endedAt: new Date() },
      { where: { userId: req.user.userId, endedAt: null } }
    );

    res.json({ success: true, data: { message: 'Sesión cerrada exitosamente' } });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al cerrar sesión' } });
  }
}