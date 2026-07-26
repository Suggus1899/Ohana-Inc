import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import api, { type Notification } from '@/services/api';
import { socketService } from '@/services/socket';

interface NotificationState {
  unreadCount: number;
  badges: Record<string, number>;
  lastNotification: Notification | null;
}

interface NotificationContextType {
  unreadCount: number;
  badges: Record<string, number>;
  refetchBadges: () => Promise<void>;
  refetchUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<NotificationState>({
    unreadCount: 0,
    badges: {},
    lastNotification: null,
  });
  const lastNotificationRef = useRef<Notification | null>(null);

  // Fetch initial unread count
  const refetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.getUnreadNotificationCount();
      if (res.success && res.data) {
        setState(prev => ({ ...prev, unreadCount: res.data!.count }));
      }
    } catch {
      // silent
    }
  }, []);

  // Fetch all badge counts from the consolidated endpoint
  const refetchBadges = useCallback(async () => {
    try {
      const res = await api.request<Record<string, number>>('/notifications/badge-counts');
      if (res.success && res.data) {
        setState(prev => ({
          ...prev,
          unreadCount: res.data!.unreadNotifications ?? prev.unreadCount,
          badges: res.data!,
        }));
      }
    } catch {
      // Fallback: just get unread count
      refetchUnreadCount();
    }
  }, [refetchUnreadCount]);

  // Socket event listeners
  useEffect(() => {
    socketService.connect();

    const unsubNotification = socketService.on('notification:new', (data: { notification: Notification }) => {
      setState(prev => ({
        ...prev,
        unreadCount: prev.unreadCount + 1,
        lastNotification: data.notification,
      }));
      lastNotificationRef.current = data.notification;
      // Dispatch custom event for NotificationsSection to pick up
      window.dispatchEvent(new CustomEvent('notif_new', { detail: data.notification }));
    });

    const unsubBadge = socketService.on('badge:update', (data: Record<string, number>) => {
      setState(prev => ({
        ...prev,
        ...(data.unreadNotifications !== undefined ? { unreadCount: data.unreadNotifications } : {}),
        badges: { ...prev.badges, ...data },
      }));
    });

    // Initial fetch
    refetchBadges();

    return () => {
      unsubNotification();
      unsubBadge();
    };
  }, [refetchBadges]);

  return (
    <NotificationContext.Provider value={{
      unreadCount: state.unreadCount,
      badges: state.badges,
      refetchBadges,
      refetchUnreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
