import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { demoUserByRole } from '@/services/mockData';

export type UserRole = 'admin' | 'cliente' | 'operator' | 'propietario' | 'estudiante';

export interface User {
  id: number;
  name: string;
  email: string;
  phonePrefix: string;
  phone: string;
  cedulaType: string;
  cedula: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  role: UserRole;
  isVerified: boolean;
  verificationLevel?: number;
  profilePhotoUrl?: string;
  authProvider?: 'local' | 'google';
  hasPassword?: boolean;
  tutorialCompleted?: boolean;
  avgRatingAsOwner?: number;
  reviewCountAsOwner?: number;
  avgRatingAsTenant?: number;
  reviewCountAsTenant?: number;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phonePrefix: string;
  phone: string;
  cedulaType: string;
  cedula: string;
  dateOfBirth?: string;
  gender?: string;
  role?: 'cliente' | 'operator' | 'admin' | 'propietario' | 'estudiante';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; errorCode?: string; fieldErrors?: Record<string, string> }>;
  loginAsDemo: (role: UserRole) => void;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string; fieldErrors?: Record<string, string> }>;
  logout: () => void;
  getRedirectPath: () => string;
  googleLogin: () => void;
  updateUser: (updates: Partial<User>) => void;
  completeAuth: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [demoMode, setDemoMode] = useState<boolean>(localStorage.getItem('demoMode') === 'true');

  // Listen for global auth:expired events — auto-redirect to login
  useEffect(() => {
    const handleAuthExpired = () => {
      setSessionExpired(true);
      setUser(null);
      setToken(null);
      api.setToken(null);
      localStorage.removeItem('token');
      window.location.href = '/login';
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      // Demo mode: skip backend call, use stored demo user
      if (localStorage.getItem('demoMode') === 'true') {
        const role = (localStorage.getItem('demoRole') as UserRole) || 'cliente';
        const demoUser = demoUserByRole[role];
        if (demoUser) {
          setUser(demoUser as unknown as User);
          setToken('demo-token');
          setDemoMode(true);
          setIsLoading(false);
          return;
        }
      }

      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        api.setToken(storedToken);
        try {
          const response = await api.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data.user);
            setToken(storedToken);
          } else if (response.error?.code === 'SESSION_EXPIRED') {
            // Session was force-ended by another login — redirect
            localStorage.removeItem('token');
            api.setToken(null);
            window.location.href = '/login';
            return;
          } else {
            // Token invalid/expired/user-not-found — silently clear
            api.setToken(null);
            setIsLoading(false);
            return;
          }
        } catch {
          // Network error — keep token, retry on next mount
          setIsLoading(false);
          return;
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        const { user: userData, token: newToken } = response.data;
        setUser(userData);
        setToken(newToken);
        api.setToken(newToken);
        return { success: true };
      }
      
      const details = response.error?.details;
      const fieldErrors: Record<string, string> = {};
      if (details && typeof details === 'object' && !Array.isArray(details)) {
        for (const [key, msg] of Object.entries(details)) {
          if (typeof msg === 'string') fieldErrors[key] = msg;
        }
      }
      return { 
        success: false, 
        error: response.error?.message || 'Error al iniciar sesión',
        errorCode: response.error?.code,
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, []);

  const loginAsDemo = useCallback((role: UserRole) => {
    const demoUser = demoUserByRole[role];
    if (!demoUser) return;
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoRole', role);
    setDemoMode(true);
    setUser(demoUser as unknown as User);
    setToken('demo-token');
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      const response = await api.register(userData);
      
      if (response.success && response.data) {
        // Registration does NOT authenticate the user.
        // The user must verify their email first.
        // After email verification, verifyEmailCode returns the JWT + user.
        return { success: true };
      }
      
      const details = response.error?.details;
      const fieldErrors: Record<string, string> = {};
      if (details && typeof details === 'object' && !Array.isArray(details)) {
        for (const [key, msg] of Object.entries(details)) {
          if (typeof msg === 'string') fieldErrors[key] = msg;
        }
      }
      return { 
        success: false, 
        error: response.error?.message || 'Error al registrarse',
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, []);

  const logout = useCallback(async () => {
    const wasDemo = localStorage.getItem('demoMode') === 'true';
    if (wasDemo) {
      localStorage.removeItem('demoMode');
      localStorage.removeItem('demoRole');
      setDemoMode(false);
    } else {
      try {
        await api.logout();
      } catch {
        // Ignore backend errors, logout locally regardless
      }
    }
    setUser(null);
    setToken(null);
    setSessionExpired(false);
    api.setToken(null);
  }, []);

  const googleLogin = useCallback(() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3026/api';
    const apiUrl = baseUrl.replace(/\/api\/?$/, '');
    window.location.href = `${apiUrl}/api/auth/google`;
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const completeAuth = useCallback((newToken: string, userData: User) => {
    setUser(userData);
    setToken(newToken);
    api.setToken(newToken);
  }, []);

  const getRedirectPath = useCallback(() => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'operator':
        return '/operator';
      case 'propietario':
        return '/propietario';
      case 'cliente':
        return '/cliente';
      case 'estudiante':
        return '/estudiante';
      default:
        return '/login';
    }
  }, [user]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token,
        isAuthenticated: !!user, 
        isLoading,
        sessionExpired,
        isDemoMode: demoMode,
        login, 
        loginAsDemo,
        register, 
        logout,
        getRedirectPath,
        googleLogin,
        updateUser,
        completeAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Backward compatibility - alias for useAuth
export const useUser = useAuth;
