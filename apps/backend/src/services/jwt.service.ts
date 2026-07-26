import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JWTPayload, UserRole } from '../types';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId?: number;
  id?: number;
  email: string;
  role: UserRole;
  verificationLevel?: number;
}

export function generateToken(payload: TokenPayload, expiresIn?: string): string {
  // Ensure both userId and id are set for backward compatibility
  const tokenData = {
    ...payload,
    userId: payload.userId || payload.id,
    id: payload.id || payload.userId
  };
  
  return jwt.sign(tokenData, JWT_SECRET, {
    expiresIn: expiresIn || JWT_EXPIRES_IN
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

export function getTokenExpirationTime(token: string): number | null {
  const decoded = decodeToken(token);
  return decoded?.exp || null;
}
