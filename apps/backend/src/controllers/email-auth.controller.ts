import { Request, Response } from 'express';
import { Op } from 'sequelize';
import crypto from 'crypto';
import { User, EmailVerificationCode, UserSession } from '../models';
import { sendEmail } from '../services/email.service';
import { generateToken } from '../services/jwt.service';
import {
  emailVerificationTemplate,
  passwordResetTemplate,
  passwordChangedTemplate,
  welcomeTemplate
} from '../services/email-templates';
import { ApiResponse, ErrorCodes } from '../types';
import { redis, isRedisConnected } from '../config/redis';

/**
 * Genera un código OTP de 6 dígitos
 */
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * POST /api/auth/request-password-reset
 * Solicitar código para restablecer contraseña
 */
export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  try {
    const { email: rawEmail } = req.body;

    const email = rawEmail ? rawEmail.toLowerCase().trim() : '';

    if (!email) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCodes.VALIDATION_ERROR, message: 'El correo electrónico es requerido' }
      } as ApiResponse);
      return;
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'EMAIL_NOT_FOUND', message: 'No existe una cuenta registrada con este correo electrónico.' }
      } as ApiResponse);
      return;
    }

    // Verificar bloqueo de 24h por exceso de intentos (max 2 envíos)
    const resetCounterKey = `pwd_reset_count:${user.email}`;
    if (isRedisConnected()) {
      const attempts = await redis.get(resetCounterKey);
      if (attempts && parseInt(attempts, 10) >= 2) {
        res.status(429).json({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Ya solicitaste 2 códigos de restablecimiento. Espera 24 horas para volver a intentarlo.'
          }
        } as ApiResponse);
        return;
      }
    }

    // Invalidar códigos previos
    await EmailVerificationCode.update(
      { usedAt: new Date() },
      { where: { email: user.email, type: 'password_reset', usedAt: null } }
    );

    // Generar nuevo código
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await EmailVerificationCode.create({
      userId: user.id,
      email: user.email,
      code,
      type: 'password_reset',
      expiresAt
    });

    // Incrementar contador de intentos en Redis (TTL 24h)
    if (isRedisConnected()) {
      await redis.incr(resetCounterKey);
      const ttl = await redis.ttl(resetCounterKey);
      if (ttl < 0) {
        await redis.expire(resetCounterKey, 86400); // 24h
      }
    }

    // Enviar correo
    const result = await sendEmail({
      to: user.email,
      subject: 'Restablecer contraseña',
      html: passwordResetTemplate(user.name, code)
    });

    if (!result.success) {
      if (result.rateLimited) {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Servicio de restablecimiento de contraseña no disponible, intente mañana nuevamente por favor.'
          }
        } as ApiResponse);
        return;
      }
      res.status(500).json({
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Error al enviar el correo. Intenta más tarde.' }
      } as ApiResponse);
      return;
    }

    // Informar cuántos intentos quedan
    let attemptsUsed = 1;
    if (isRedisConnected()) {
      const count = await redis.get(resetCounterKey);
      attemptsUsed = count ? parseInt(count, 10) : 1;
    }
    const remaining = 2 - attemptsUsed;

    res.status(200).json({
      success: true,
      data: {
        message: remaining > 0
          ? `Código enviado a ${user.email}. Puedes solicitar un reenvío más si lo necesitas.`
          : `Código enviado a ${user.email}. Este es tu último intento, si no lo usas deberás esperar 24 horas.`
      }
    } as ApiResponse);
  } catch (error) {
    console.error('[EmailAuth] requestPasswordReset error:', error);
    res.status(500).json({
      success: false,
      error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Error interno del servidor' }
    } as ApiResponse);
  }
}

/**
 * POST /api/auth/verify-reset-code
 * Verificar que el código OTP es válido (sin consumirlo aún)
 */
export async function verifyResetCode(req: Request, res: Response): Promise<void> {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Email y código son requeridos' }
      } as ApiResponse);
      return;
    }

    const record = await EmailVerificationCode.findOne({
      where: {
        email: email.toLowerCase().trim(),
        code,
        type: 'password_reset',
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!record) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CODE', message: 'El código es inválido o ha expirado. Solicita uno nuevo.' }
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { valid: true, message: 'Código verificado correctamente' }
    } as ApiResponse);
  } catch (error) {
    console.error('[EmailAuth] verifyResetCode error:', error);
    res.status(500).json({
      success: false,
      error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Error interno del servidor' }
    } as ApiResponse);
  }
}

/**
 * POST /api/auth/reset-password
 * Restablecer contraseña usando el código OTP
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Email, código y nueva contraseña son requeridos' }
      } as ApiResponse);
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCodes.VALIDATION_ERROR, message: 'La contraseña debe tener al menos 6 caracteres' }
      } as ApiResponse);
      return;
    }

    const record = await EmailVerificationCode.findOne({
      where: {
        email: email.toLowerCase().trim(),
        code,
        type: 'password_reset',
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!record) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CODE', message: 'El código es inválido o ha expirado. Solicita uno nuevo.' }
      } as ApiResponse);
      return;
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: ErrorCodes.NOT_FOUND, message: 'Usuario no encontrado' }
      } as ApiResponse);
      return;
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    // Marcar código como usado (eliminarlo lógicamente)
    await record.update({ usedAt: new Date() });

    // Cerrar todas las sesiones activas para forzar re-login con la nueva contraseña
    await UserSession.update(
      { endedAt: new Date() },
      { where: { userId: user.id, endedAt: null } }
    );

    // Enviar email de confirmación
    await sendEmail({
      to: user.email,
      subject: 'Contraseña actualizada',
      html: passwordChangedTemplate(user.name)
    });

    res.status(200).json({
      success: true,
      data: { message: 'Contraseña restablecida exitosamente' }
    } as ApiResponse);
  } catch (error) {
    console.error('[EmailAuth] resetPassword error:', error);
    res.status(500).json({
      success: false,
      error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Error interno del servidor' }
    } as ApiResponse);
  }
}

/**
 * POST /api/auth/send-verification-code
 * Enviar código de verificación de email durante el registro
 */
export async function sendVerificationCode(req: Request, res: Response): Promise<void> {
  try {
    const { email, name } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCodes.VALIDATION_ERROR, message: 'El correo electrónico es requerido' }
      } as ApiResponse);
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verificar límite: máximo 3 envíos por día por email
    const verifyCounterKey = `verify_code_count:${normalizedEmail}`;
    if (isRedisConnected()) {
      const attempts = await redis.get(verifyCounterKey);
      if (attempts && parseInt(attempts, 10) >= 3) {
        res.status(429).json({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Ya solicitaste 3 códigos de verificación hoy. Espera 24 horas para volver a intentarlo.'
          }
        } as ApiResponse);
        return;
      }
    }

    // Invalidar códigos previos
    await EmailVerificationCode.update(
      { usedAt: new Date() },
      { where: { email: normalizedEmail, type: 'email_verification', usedAt: null } }
    );

    // Generar nuevo código
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await EmailVerificationCode.create({
      email: normalizedEmail,
      code,
      type: 'email_verification',
      expiresAt
    });

    // Incrementar contador en Redis (TTL 24h)
    if (isRedisConnected()) {
      await redis.incr(verifyCounterKey);
      const ttl = await redis.ttl(verifyCounterKey);
      if (ttl < 0) {
        await redis.expire(verifyCounterKey, 86400);
      }
    }

    const result = await sendEmail({
      to: normalizedEmail,
      subject: 'Verifica tu correo electrónico',
      html: emailVerificationTemplate(name || 'Usuario', code)
    });

    if (!result.success) {
      if (result.rateLimited) {
        res.status(503).json({
          success: false,
          error: { code: 'SERVICE_UNAVAILABLE', message: 'Servicio no disponible temporalmente. Intenta mañana.' }
        } as ApiResponse);
        return;
      }
      res.status(500).json({
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Error al enviar el correo de verificación' }
      } as ApiResponse);
      return;
    }

    // Informar cuántos intentos quedan
    let attemptsUsed = 1;
    if (isRedisConnected()) {
      const count = await redis.get(verifyCounterKey);
      attemptsUsed = count ? parseInt(count, 10) : 1;
    }
    const remaining = 3 - attemptsUsed;

    res.status(200).json({
      success: true,
      data: {
        message: remaining > 0
          ? `Código enviado a ${normalizedEmail}. Puedes solicitar ${remaining} reenvío${remaining > 1 ? 's' : ''} más hoy.`
          : `Código enviado a ${normalizedEmail}. No podrás solicitar más códigos hasta dentro de 24 horas.`
      }
    } as ApiResponse);
  } catch (error) {
    console.error('[EmailAuth] sendVerificationCode error:', error);
    res.status(500).json({
      success: false,
      error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Error interno del servidor' }
    } as ApiResponse);
  }
}

/**
 * POST /api/auth/verify-email
 * Verificar el código de email y completar la verificación de la cuenta
 */
export async function verifyEmailCode(req: Request, res: Response): Promise<void> {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Email y código son requeridos' }
      } as ApiResponse);
      return;
    }

    const record = await EmailVerificationCode.findOne({
      where: {
        email: email.toLowerCase().trim(),
        code,
        type: 'email_verification',
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!record) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CODE', message: 'El código es inválido o ha expirado. Solicita uno nuevo.' }
      } as ApiResponse);
      return;
    }

    // Marcar código como usado
    await record.update({ usedAt: new Date() });

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      res.status(200).json({
        success: true,
        data: { message: 'Correo electrónico verificado exitosamente', emailVerified: true }
      } as ApiResponse);
      return;
    }

    await user.update({ emailVerified: true } as any);

    // Enviar email de bienvenida
    await sendEmail({
      to: user.email,
      subject: 'Tu correo ha sido verificado',
      html: welcomeTemplate(user.name)
    });

    // Cerrar sesión previa si existe (sesión única)
    const activeSession = await UserSession.findOne({
      where: { userId: user.id, endedAt: null }
    });
    if (activeSession) {
      await activeSession.update({ endedAt: new Date() });
    }

    // Crear nueva sesión y generar JWT
    await UserSession.create({ userId: user.id, startedAt: new Date() });

    const token = generateToken({
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      verificationLevel: user.verificationLevel ?? 0
    }, '7d');

    res.status(200).json({
      success: true,
      data: {
        message: 'Correo electrónico verificado exitosamente',
        emailVerified: true,
        token,
        user: user.toJSON()
      }
    } as ApiResponse);
  } catch (error) {
    console.error('[EmailAuth] verifyEmailCode error:', error);
    res.status(500).json({
      success: false,
      error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Error interno del servidor' }
    } as ApiResponse);
  }
}
