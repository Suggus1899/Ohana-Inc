import React, { createContext, useContext, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '@/services/api';

export type EventType = 'CLICK' | 'SEARCH' | 'VIEW' | 'SCROLL_LIMIT';

export interface BehaviorEvent {
  eventType: EventType;
  targetElement?: string;
  metadata?: Record<string, unknown>;
  sessionId?: number | null;
  userId?: number | null;
  created_at?: string;
}

interface BehaviorTrackerContextType {
  trackEvent: (event: Omit<BehaviorEvent, 'userId' | 'sessionId'>) => void;
  sessionId: number | null;
}

const BehaviorTrackerContext = createContext<BehaviorTrackerContextType>({
  trackEvent: () => {},
  sessionId: null,
});

const FLUSH_INTERVAL_MS = 30_000;
const MAX_BATCH_SIZE = 50;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3026/api';

export const BehaviorTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const sessionIdRef = useRef<number | null>(null);
  const queueRef = useRef<BehaviorEvent[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── flush: envía el batch al backend ──────────────────────────────────────
  const flushQueue = useCallback(async () => {
    if (queueRef.current.length === 0) return;
    const batch = queueRef.current.splice(0, MAX_BATCH_SIZE);
    try {
      await api.trackBatch(batch);
    } catch {
      // silencioso — no interrumpir la app
    }
  }, []);

  // ── endSession: cierra la sesión activa ───────────────────────────────────
  const endCurrentSession = useCallback(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    sessionIdRef.current = null;
    // keepalive para que funcione aunque la pestaña se esté cerrando
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/metrics/session/end`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sessionId: sid }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  // ── Inicia sesión cuando hay usuario autenticado ───────────────────────────
  useEffect(() => {
    if (!user) {
      // Usuario hizo logout: cerrar sesión si había una activa
      endCurrentSession();
      return;
    }

    const startSession = async () => {
      // Evitar doble sesión si ya hay una activa para este usuario
      if (sessionIdRef.current) return;
      try {
        const osDevice = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
        const res = await api.startSession(osDevice);
        if (res.success && res.data) {
          sessionIdRef.current = res.data.sessionId;
        }
      } catch {
        // silencioso
      }
    };

    startSession();

    // Cleanup: se ejecuta cuando user?.id cambia (logout o cambio de usuario)
    return () => {
      flushQueue();
      endCurrentSession();
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Flush periódico cada 30s ───────────────────────────────────────────────
  useEffect(() => {
    flushTimerRef.current = setInterval(flushQueue, FLUSH_INTERVAL_MS);
    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, [flushQueue]);

  // ── visibilitychange: flush + cierre de sesión al ocultar la pestaña ──────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // 1. Flush de eventos pendientes
        const events = [...queueRef.current];
        if (events.length > 0) {
          queueRef.current = [];
          const token = localStorage.getItem('token');
          fetch(`${API_BASE}/metrics/track-batch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(events),
            keepalive: true,
          }).catch(() => {});
        }
        // 2. Cerrar sesión
        endCurrentSession();
      } else if (document.visibilityState === 'visible') {
        // Pestaña volvió a ser visible: abrir nueva sesión si hay usuario
        if (user && !sessionIdRef.current) {
          const osDevice = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
          api.startSession(osDevice).then((res) => {
            if (res.success && res.data) {
              sessionIdRef.current = res.data.sessionId;
            }
          }).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, endCurrentSession]);  

  // ── trackEvent ─────────────────────────────────────────────────────────────
  const trackEvent = useCallback((event: Omit<BehaviorEvent, 'userId' | 'sessionId'>) => {
    if (!user) return;
    queueRef.current.push({
      ...event,
      userId: user.id,
      sessionId: sessionIdRef.current,
      created_at: new Date().toISOString(),
    });
    if (queueRef.current.length >= MAX_BATCH_SIZE) {
      flushQueue();
    }
  }, [user, flushQueue]);

  return (
    <BehaviorTrackerContext.Provider value={{ trackEvent, sessionId: sessionIdRef.current }}>
      {children}
    </BehaviorTrackerContext.Provider>
  );
};

export const useBehaviorTracker = () => useContext(BehaviorTrackerContext);
