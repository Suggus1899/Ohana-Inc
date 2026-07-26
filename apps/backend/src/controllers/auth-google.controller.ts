import { Request, Response } from 'express';
import passport from 'passport';
import { generateToken } from '../services/jwt.service';
import { UserSession } from '../models';
import { AuthRequest } from '../types';
import User from '../models/User';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

export const googleAuthCallback = async (req: Request, res: Response) => {
  passport.authenticate('google', { session: false }, async (err: any, data: { user: any; isNew: boolean } | false) => {
    try {
      if (err || !data) {
        const message = err?.message || 'Error al autenticar con Google';
        return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
      }

      const { user, isNew } = data;

      if (isNew) {
        // Usuario nuevo: sesión temporal + tempToken de 15m
        const tempToken = generateToken(
          { userId: user.id, id: user.id, email: user.email, role: user.role, verificationLevel: user.verificationLevel || 0 },
          '15m'
        );
        await UserSession.create({ userId: user.id, startedAt: new Date() });
        return res.redirect(
          `${FRONTEND_URL}/auth/google-setup?tempToken=${tempToken}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&photo=${encodeURIComponent(user.profilePhotoUrl || '')}`
        );
      }

      // Usuario existente: cerrar sesiones previas (permitir re-login desde cualquier dispositivo)
      await UserSession.update(
        { endedAt: new Date() },
        { where: { userId: user.id, endedAt: null } }
      );

      const token = generateToken(
        { userId: user.id, id: user.id, email: user.email, role: user.role, verificationLevel: user.verificationLevel || 0 },
        '7d'
      );

      await UserSession.create({ userId: user.id, startedAt: new Date() });

      return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error: any) {
      console.error('[Google Auth Callback] Error:', error);
      const message = 'Ocurrió un error al iniciar sesión con Google. Intenta nuevamente.';
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
    }
  })(req, res);
};

export const completeGoogleRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'No autorizado' } });
    }

    const { role, phonePrefix, phone, cedulaType, cedula, dateOfBirth, gender } = req.body;

    if (!role || !phonePrefix || !phone || !cedulaType || !cedula) {
      return res.status(400).json({ success: false, error: { message: 'Faltan campos requeridos: rol, teléfono y cédula' } });
    }

    const validRoles = ['estudiante', 'cliente', 'propietario'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: { message: 'Rol no válido' } });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'Usuario no encontrado' } });
    }

    await user.update({
      role: role as any,
      phonePrefix,
      phone,
      cedulaType,
      cedula,
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      gender: gender || user.gender,
      accountStatus: 'active',
    });

    const token = generateToken(
      { userId: user.id, id: user.id, email: user.email, role: user.role, verificationLevel: user.verificationLevel || 0 },
      '7d'
    );

    // Reemplazar la sesión temporal por una nueva sesión activa
    await UserSession.update({ endedAt: new Date() }, { where: { userId: user.id, endedAt: null } });
    await UserSession.create({ userId: user.id, startedAt: new Date() });

    res.json({ success: true, data: { user: user.toJSON(), token } });
  } catch (error: any) {
    console.error('[Google Auth] Complete registration error:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path;
      if (field === 'cedula') {
        return res.status(400).json({ success: false, error: { message: 'La cédula ya está registrada. Si es tuya, inicia sesión con tu cuenta anterior.' } });
      }
      if (field === 'email') {
        return res.status(400).json({ success: false, error: { message: 'El correo ya está registrado. Intenta iniciar sesión.' } });
      }
      return res.status(400).json({ success: false, error: { message: 'Ya existe una cuenta con estos datos' } });
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, error: { message: 'Los datos ingresados no son válidos' } });
    }

    res.status(500).json({ success: false, error: { message: 'Error al completar el registro. Intenta nuevamente.' } });
  }
};
