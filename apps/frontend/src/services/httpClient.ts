import type { ApiResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3026/api';

// Demo mode helpers — when localStorage.demoMode === 'true', API calls are
// intercepted and served from mock data (see services/mockApi.ts).
export function isDemoMode(): boolean {
  return localStorage.getItem('demoMode') === 'true';
}

export function getSessionId(): string {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

const NO_AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/request-password-reset',
  '/auth/verify-reset-code',
  '/auth/reset-password',
  '/auth/send-verification-code',
  '/auth/verify-email',
  '/auth/google/complete',
];

/**
 * Core HTTP client — shared by all domain API modules.
 *
 * Handles:
 * - JWT token management (get/set from localStorage)
 * - Authorization header injection (skipped for auth endpoints)
 * - Content-Type negotiation (JSON vs FormData)
 * - 401 session expiration event dispatch
 * - Network error fallback
 */
class HttpClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: HeadersInit = { ...options.headers };

    if (!(options.body instanceof FormData) && !('Content-Type' in (headers as Record<string, string>))) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const isAuthEndpoint = NO_AUTH_ENDPOINTS.some((ep) => endpoint.includes(ep));

    if (!isAuthEndpoint) {
      const currentToken = this.token || localStorage.getItem('token');
      if (currentToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${currentToken}`;
      }
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (response.status === 401 && !isAuthEndpoint) {
        window.dispatchEvent(new CustomEvent('auth:expired', { detail: { endpoint, message: data?.error?.message || 'Sesión expirada' } }));
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Network error occurred' },
      };
    }
  }
}

export const httpClient = new HttpClient(API_BASE_URL);
export { API_BASE_URL };
