import passport from 'passport';
import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import User from '../models/User';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '';

/**
 * Genera una cédula pseudo-única para usuarios de Google.
 * Usa crypto.randomBytes para evitar colisiones de timestamp.
 */
function generatePseudoCedula(): string {
  return `g${crypto.randomBytes(8).toString('hex')}`;
}

export function setupPassport(): void {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth no configurado: faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
  }, async (_accessToken: string, _refreshToken: string, profile: any, done: VerifyCallback) => {
    try {
      const googleId = profile.id;
      const rawEmail = profile.emails?.[0]?.value || '';
      const email = rawEmail ? rawEmail.toLowerCase().trim() : '';
      const name = profile.displayName || profile.name?.givenName || '';
      const profilePhotoUrl = profile.photos?.[0]?.value || '';

      if (!googleId) {
        return done(new Error('Google no proporcionó un identificador válido'), undefined);
      }

      if (!email) {
        return done(new Error('Google no proporcionó un correo electrónico'), undefined);
      }

      // Buscar usuario por googleId (búsqueda explícita, sin undefined)
      let user = await User.findOne({ where: { googleId } });

      // Si no se encuentra por googleId, buscar por email normalizado
      if (!user) {
        user = await User.findOne({ where: { email } });
      }

      if (user) {
        // Usuario existe (registrado tradicionalmente o ya con google)
        if (user.googleId !== googleId) {
          // Vincular cuenta: el usuario se registró con email/password pero no con Google
          const updates: any = {
            googleId,
            emailVerified: true,
          };
          if (profilePhotoUrl && !user.profilePhotoUrl) {
            updates.profilePhotoUrl = profilePhotoUrl;
          }
          if (!user.verificationLevel || user.verificationLevel < 1) {
            updates.verificationLevel = 1;
          }
          await user.update(updates);
        }
        // isNew=false para usuarios existentes (no van a Google setup)
        return done(null, { user, isNew: false });
      }

      // Crear nuevo usuario Google
      // Generar cedula pseudo-única con retry por si colisiona
      let attempts = 0;
      let newUser: User | null = null;
      let lastError: any = null;

      while (attempts < 3 && !newUser) {
        try {
          newUser = await User.create({
            name: name || 'Usuario Google',
            email,
            googleId,
            authProvider: 'google' as any,
            emailVerified: true,
            isVerified: false,
            verificationLevel: 1,
            accountStatus: 'pending' as any,
            profilePhotoUrl,
            phonePrefix: '',
            phone: '',
            cedulaType: '',
            cedula: generatePseudoCedula(),
            role: 'propietario',
          });
        } catch (err: any) {
          lastError = err;
          // Si es error de unique constraint en cedula, reintentar con otra pseudo-cedula
          if (err?.name === 'SequelizeUniqueConstraintError' && err?.errors?.[0]?.path === 'cedula') {
            attempts++;
            continue;
          }
          // Si es error de unique constraint en email, significa que el email ya existe
          // pero la búsqueda anterior no lo encontró (race condition). Reintentar la búsqueda.
          if (err?.name === 'SequelizeUniqueConstraintError' && err?.errors?.[0]?.path === 'email') {
            user = await User.findOne({ where: { email } });
            if (user) {
              if (user.googleId !== googleId) {
                await user.update({ googleId, emailVerified: true });
              }
              return done(null, { user, isNew: false });
            }
          }
          // Otro error: propagar
          return done(err as Error, undefined);
        }
      }

      if (!newUser) {
        console.error('[Passport] No se pudo crear usuario Google después de 3 intentos:', lastError);
        return done(new Error('No se pudo crear la cuenta. Intenta nuevamente.'), undefined);
      }

      // isNew=true: el usuario debe completar el setup (rol, phone, cedula real)
      return done(null, { user: newUser, isNew: true });
    } catch (error) {
      console.error('[Passport] Error en estrategia Google:', error);
      return done(error as Error, undefined);
    }
  }));
}

export default passport;
