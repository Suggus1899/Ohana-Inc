# Unified Notification System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for syntax tracking.

**Goal:** Unificar sockets, eliminar polling de badges, agregar push en tiempo real para notificaciones in-app.

**Architecture:** Socket único por cliente (1 conexión) que maneja eventos `chat:*`, `transaction:*`, `notification:*` y `badge:*`. Backend emite eventos al crear/modificar notificaciones. Frontend actualiza estado en tiempo real vía React context.

**Tech Stack:** Node.js/Express + Socket.IO + Redis adapter (backend) / React + Vite + Socket.IO client (frontend)

---

### Task 1: Backend — BadgeService

**Files:**
- Create: `src/services/badge.service.ts`
- Modify: (none yet, used by later tasks)

**Service that centralizes badge count queries per role. Reduces N frontend API calls to 1 backend call.**

- [ ] **Step 1: Create BadgeService**

```typescript
// src/services/badge.service.ts
import { Op } from 'sequelize';
import { User, Notification, ChatConversation, ChatMessage, Property, Transaction } from '../models';

export interface BadgeCounts {
  unreadNotifications: number;
  // Role-specific
  pendingKYC?: number;
  pendingReports?: number;
  draftAnnouncements?: number;
  pendingVerifications?: number;
  pendingReviews?: number;
  pendingSupport?: number;
  pendingTasks?: number;
  unreadMessages?: number;
  pendingRequests?: number;
  activeRequests?: number;
}

export class BadgeService {
  async getCounts(userId: number, role: string): Promise<BadgeCounts> {
    const base = {
      unreadNotifications: await Notification.count({ where: { userId, isRead: false } }),
    };

    const normalizedRole = role.toLowerCase();

    if (normalizedRole === 'admin') {
      const [verifications, reports, announcements] = await Promise.all([
        Property.count({ where: { verificationStatus: 'pending' } }),
        Transaction.count({ where: { status: 'flagged' } }),
        Transaction.count({ where: { status: 'draft' } }), // placeholder para announcements
      ]);
      return {
        ...base,
        pendingKYC: verifications,
        pendingReports: reports,
        draftAnnouncements: announcements,
      };
    }

    if (normalizedRole === 'operator') {
      const [verifications, reviews, tickets, reports, tasks] = await Promise.all([
        Property.count({ where: { verificationStatus: 'pending' } }),
        Property.count({ where: { status: 'pending_review' } }),
        Transaction.count({ where: { status: 'support_pending' } }),
        Transaction.count({ where: { status: 'flagged' } }),
        Transaction.count({ where: { status: 'task_pending' } }),
      ]);
      return {
        ...base,
        pendingVerifications: verifications,
        pendingReviews: reviews,
        pendingSupport: tickets,
        pendingReports: reports,
        pendingTasks: tasks,
      };
    }

    // owner/propietario
    if (normalizedRole === 'owner' || normalizedRole === 'propietario') {
      const [unreadMessages, pendingRequests] = await Promise.all([
        ChatConversation.sum('unreadCount' as any, {
          where: { participant1Id: userId },
        }).then(r => r || 0),
        Transaction.count({ where: { ownerId: userId, status: 'pending' } }),
      ]);
      return {
        ...base,
        unreadMessages: Number(unreadMessages),
        pendingRequests,
      };
    }

    // client / estudiante / default
    const [unreadMessages, activeRequests] = await Promise.all([
      ChatConversation.sum('unreadCount' as any, {
        where: { participant2Id: userId },
      }).then(r => r || 0),
      Transaction.count({
        where: { clientId: userId, status: { [Op.in]: ['pending', 'viewed'] } },
      }),
    ]);
    return {
      ...base,
      unreadMessages: Number(unreadMessages),
      activeRequests,
    };
  }
}

export const badgeService = new BadgeService();
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit src/services/badge.service.ts`
Expected: No errors

### Task 2: Backend — Badge Counts Endpoint

**Files:**
- Create: (none)
- Modify: `src/routes/notification.routes.ts`
- Modify: `src/controllers/notification.controller.ts`

- [ ] **Step 1: Add `getBadgeCounts` controller function**

```typescript
// Add to src/controllers/notification.controller.ts
import { badgeService } from '../services/badge.service';

// ...existing functions...

export async function getBadgeCounts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const role = req.user!.role || 'cliente';
    const counts = await badgeService.getCounts(userId, role);
    res.json({ success: true, data: counts });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Error al obtener contadores' } });
  }
}
```

- [ ] **Step 2: Add route**

```typescript
// Add to src/routes/notification.routes.ts
import { getBadgeCounts } from '../controllers/notification.controller';

router.get('/badge-counts', authenticate, getBadgeCounts);
```

- [ ] **Step 3: Test endpoint compiles**

Run: `npx tsc --noEmit`
Expected: No errors

### Task 3: Backend — Socket.IO emit for notification CRUD

**Files:**
- Modify: `src/controllers/notification.controller.ts`
- Modify: `src/services/notification-inapp.service.ts`

**After every notification create/read/delete, emit `notification:new` and `badge:update` to user's socket room.**

- [ ] **Step 1: Add socket emit helper to notification-inapp.service**

```typescript
// Add imports at top of src/services/notification-inapp.service.ts
import { getIO } from '../websocket/socket';
import { badgeService } from './badge.service';

// Add method to class:
export class NotificationInAppService {
  // ...existing methods...

  private async emitAfterCreate(userId: number, notification: Notification): Promise<void> {
    const io = getIO();
    if (!io) return;

    // Emit new notification event
    io.to(`user_${userId}`).emit('notification:new', { notification });

    // Emit updated unread count
    const count = await Notification.count({ where: { userId, isRead: false } });
    io.to(`user_${userId}`).emit('badge:update', {
      unreadNotifications: count,
    });
  }

  private async emitBadgeUpdate(userId: number): Promise<void> {
    const io = getIO();
    if (!io) return;
    const count = await Notification.count({ where: { userId, isRead: false } });
    io.to(`user_${userId}`).emit('badge:update', {
      unreadNotifications: count,
    });
  }
}
```

- [ ] **Step 2: Call emitAfterCreate from create() method**

```typescript
// In src/services/notification-inapp.service.ts, update create():
async create(input: CreateNotificationInput): Promise<Notification> {
  const notification = await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    data: input.data ?? null,
  } as any);

  // Emit socket events in background (don't block response)
  this.emitAfterCreate(input.userId, notification).catch(err =>
    console.error('[NotificationService] Socket emit error:', err)
  );

  return notification;
}
```

- [ ] **Step 3: Emit badge updates on markAsRead/markAllAsRead/delete in controller**

```typescript
// Update src/controllers/notification.controller.ts

// Add to existing imports:
import { getIO } from '../websocket/socket';
import { Notification } from '../models';

// Update markAsRead - after success:
export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) {
      res.status(404).json({ success: false, error: { message: 'Notificación no encontrada' } });
      return;
    }

    await notification.update({ isRead: true });

    // Emit badge update
    const io = getIO();
    if (io) {
      const count = await Notification.count({ where: { userId, isRead: false } });
      io.to(`user_${userId}`).emit('badge:update', { unreadNotifications: count });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Error al actualizar notificación' } });
  }
}

// Update markAllAsRead - after success:
export async function markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    await Notification.update({ isRead: true }, { where: { userId, isRead: false } });

    // Emit badge update
    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit('badge:update', { unreadNotifications: 0 });
    }

    res.json({ success: true, data: { message: 'Todas las notificaciones marcadas como leídas' } });
  } catch (error) {
    // ...
  }
}

// Update deleteNotification - after success:
export async function deleteNotification(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) {
      res.status(404).json({ success: false, error: { message: 'Notificación no encontrada' } });
      return;
    }

    await notification.destroy();

    // Emit badge update
    const io = getIO();
    if (io) {
      const count = await Notification.count({ where: { userId, isRead: false } });
      io.to(`user_${userId}`).emit('badge:update', { unreadNotifications: count });
    }

    res.json({ success: true, data: { message: 'Notificación eliminada' } });
  } catch (error) {
    // ...
  }
}
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

### Task 4: Frontend — Unified Socket Singleton

**Files:**
- Modify: `src/services/socket.ts`

**Enhance the socket singleton to support event namespace routing for ALL event types, not just chat.**

- [ ] **Step 1: Rewrite socket.ts**

```typescript
// src/services/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

type EventCallback = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<EventCallback>>();
  private _connected = false;

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    if (!this.socket) {
      const token = localStorage.getItem('token');

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
      });

      this.socket.on('connect', () => {
        this._connected = true;
        console.log('[Socket] Connected:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        this._connected = false;
        console.log('[Socket] Disconnected:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
      });

      // Global event router — dispatches to registered listeners
      this.socket.onAny((event: string, ...args: any[]) => {
        const handlers = this.listeners.get(event);
        if (handlers) {
          handlers.forEach(cb => cb(...args));
        }
      });
    } else if (!this.socket.connected) {
      this.socket.connect();
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._connected = false;
  }

  get connected(): boolean {
    return this._connected;
  }

  get rawSocket(): Socket | null {
    return this.socket;
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }
}

export const socketService = new SocketService();
```

- [ ] **Step 2: Update ChatContext to use socketService**

In `src/contexts/ChatContext.tsx`, replace direct `io()` calls with `socketService.connect()` and `socketService.on()` / `socketService.off()`.

(This is mostly find-and-replace: `io(SOCKET_URL, {...})` → `socketService.connect()`, socket event listeners → `socketService.on('event', cb)`)

### Task 5: Frontend — NotificationContext

**Files:**
- Create: `src/contexts/NotificationContext.tsx`

**React context that manages notification state with real-time socket updates.**

- [ ] **Step 1: Create NotificationContext**

```typescript
// src/contexts/NotificationContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import api, { Notification } from '@/services/api';
import { socketService } from '@/services/socket';

interface NotificationState {
  unreadCount: number;
  badges: Record<string, number>;
  lastNotification: Notification | null; // For toast display
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
    } catch {}
  }, []);

  // Fetch all badge counts
  const refetchBadges = useCallback(async () => {
    try {
      // Use the new badge-counts endpoint
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
    const socket = socketService.connect();

    const unsubNotification = socketService.on('notification:new', (data: { notification: Notification }) => {
      setState(prev => ({
        ...prev,
        unreadCount: prev.unreadCount + 1,
        lastNotification: data.notification,
      }));
      // Store for the NotificationsSection to pick up
      lastNotificationRef.current = data.notification;
      // Dispatch custom event for NotificationsSection
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
```

- [ ] **Step 2: Add `request` method to api.ts for arbitrary endpoints**

The `api.request` method likely already exists. Verify the pattern used in api.ts, otherwise use the existing `api.getUnreadNotificationCount()` pattern.

### Task 6: Frontend — Refactor useTransactionNotifications

**Files:**
- Modify: `src/hooks/useTransactionNotifications.ts`

**Replace separate socket connection with shared socketService.**

- [ ] **Step 1: Rewrite hook**

```typescript
// src/hooks/useTransactionNotifications.ts
import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '@/services/socket';

export interface TransactionNotification {
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  urgent?: boolean;
}

const TRANSACTION_EVENTS = [
  'transaction:new_request',
  'transaction:approved',
  'transaction:rejected',
  'transaction:payment_submitted',
  'transaction:payment_confirmed',
  'transaction:cancelled',
  'transaction:expired',
  'dispute:new',
  'dispute:resolved',
] as const;

const EVENT_MAP: Record<string, Omit<TransactionNotification, 'data'>> = {
  'transaction:new_request': { type: 'new_request', title: 'Nueva Solicitud', message: '' },
  'transaction:approved': { type: 'approved', title: 'Solicitud Aprobada', message: '' },
  'transaction:rejected': { type: 'rejected', title: 'Solicitud Rechazada', message: '' },
  'transaction:payment_submitted': { type: 'payment_submitted', title: '¡Pago Recibido!', message: '', urgent: true },
  'transaction:payment_confirmed': { type: 'payment_confirmed', title: '¡Transacción Completada!', message: '' },
  'transaction:cancelled': { type: 'cancelled', title: 'Transacción Cancelada', message: '' },
  'transaction:expired': { type: 'expired', title: 'Transacción Expirada', message: '' },
  'dispute:new': { type: 'dispute_new', title: 'Nueva Disputa', message: '', urgent: true },
  'dispute:resolved': { type: 'dispute_resolved', title: 'Disputa Resuelta', message: '' },
};

export const useTransactionNotifications = (
  onNotification: (notification: TransactionNotification) => void
) => {
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Register one handler per event on the shared socket
    for (const event of TRANSACTION_EVENTS) {
      const unsub = socketService.on(event, (data: any) => {
        const meta = EVENT_MAP[event];
        if (!meta) return;
        callbackRef.current({
          ...meta,
          message: data.message || meta.message,
          data,
        });
      });
      unsubscribers.push(unsub);
    }

    // Ensure socket is connected
    socketService.connect();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const disconnect = useCallback(() => {
    // Don't disconnect — the shared socket may be used by other consumers
    // Just clean up local state. Socket is managed by socketService.
  }, []);

  return { disconnect };
};
```

### Task 7: Frontend — Refactor useSidebarBadges

**Files:**
- Modify: `src/hooks/useSidebarBadges.ts`

**Replace polling with badge:update socket events. Keep polling as fallback at 60s.**

- [ ] **Step 1: Rewrite hook**

```typescript
// src/hooks/useSidebarBadges.ts
import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { socketService } from '@/services/socket';

export interface SidebarBadges {
  [sectionId: string]: number;
}

export const useSidebarBadges = (role: string): SidebarBadges => {
  const [badges, setBadges] = useState<SidebarBadges>({});

  const fetchBadges = useCallback(async () => {
    try {
      // Use the new consolidated badge-counts endpoint
      const res = await api.request<Record<string, number>>('/notifications/badge-counts');
      if (res.success && res.data) {
        // Transform API response to SidebarBadges format
        const data = res.data;
        const normalizedRole = role.toLowerCase();

        if (normalizedRole === 'admin') {
          setBadges({
            kyc: data.pendingKYC || 0,
            reports: data.pendingReports || 0,
            announcements: data.draftAnnouncements || 0,
          });
        } else if (normalizedRole === 'operator') {
          setBadges({
            verifications: data.pendingVerifications || 0,
            reviews: data.pendingReviews || 0,
            'properties-review': data.pendingReviews || 0,
            support: data.pendingSupport || 0,
            reports: data.pendingReports || 0,
            tasks: data.pendingTasks || 0,
          });
        } else if (normalizedRole === 'owner' || normalizedRole === 'propietario') {
          setBadges({
            messages: data.unreadMessages || 0,
            requests: data.pendingRequests || 0,
          });
        } else {
          setBadges({
            messages: data.unreadMessages || 0,
            requests: data.activeRequests || 0,
            notifications: data.unreadNotifications || 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch sidebar badges', error);
    }
  }, [role]);

  useEffect(() => {
    // Initial fetch
    fetchBadges();

    // Listen for socket badge updates
    const unsubBadge = socketService.on('badge:update', (data: Record<string, number>) => {
      setBadges(prev => {
        const update: SidebarBadges = {};
        const normalizedRole = role.toLowerCase();

        // Map socket badge fields to sidebar fields based on role
        if (data.unreadNotifications !== undefined) {
          if (normalizedRole !== 'admin' && normalizedRole !== 'operator'
              && normalizedRole !== 'owner' && normalizedRole !== 'propietario') {
            update.notifications = data.unreadNotifications;
          }
        }
        // For transaction/notification events, refetch full badges
        return { ...prev, ...update };
      });
      // Also refetch full badges to get role-specific counts
      fetchBadges();
    });

    // Listen for transaction events that may change badge counts
    const txEvents = [
      'transaction:new_request', 'transaction:approved', 'transaction:rejected',
      'transaction:payment_submitted', 'transaction:payment_confirmed',
      'transaction:cancelled', 'transaction:expired',
      'dispute:new', 'dispute:resolved',
    ];
    const unsubscribers = txEvents.map(event =>
      socketService.on(event, () => fetchBadges())
    );

    // Ensure socket is connected
    socketService.connect();

    // Fallback polling at much lower frequency (60s instead of 10-30s)
    const fallbackInterval = setInterval(fetchBadges, 60000);

    return () => {
      clearInterval(fallbackInterval);
      unsubBadge();
      unsubscribers.forEach(u => u());
    };
  }, [role, fetchBadges]);

  return badges;
};
```

### Task 8: Frontend — NotificationsSection Real-Time

**Files:**
- Modify: `src/components/notifications/NotificationsSection.tsx`

**Listen for `notif_new` custom event to prepend new notifications in real-time.**

- [ ] **Step 1: Add real-time listener**

```typescript
// Add inside src/components/notifications/NotificationsSection.tsx
// After the existing fetch useEffect:

useEffect(() => {
  const handleNewNotification = (e: CustomEvent) => {
    const notif = e.detail as Notification;
    // Only add if it belongs on the current page
    // Prepend to the list
    setNotifications(prev => [notif, ...prev]);
    setTotal(prev => prev + 1);
    // If we now have more than LIMIT, remove the last one
    setNotifications(prev => {
      if (prev.length > LIMIT) return prev.slice(0, LIMIT);
      return prev;
    });
  };

  window.addEventListener('notif_new', handleNewNotification as EventListener);
  return () => window.removeEventListener('notif_new', handleNewNotification as EventListener);
}, [LIMIT]);
```

### Task 9: Frontend — Wire NotificationContext in App.tsx

**Files:**
- Modify: `src/App.tsx`

**Add NotificationProvider and remove Sonner.**

- [ ] **Step 1: Update App.tsx**

```typescript
// Add import:
import { NotificationProvider } from '@/contexts/NotificationContext';

// In component tree, wrap inside AuthProvider (needs token):
<AuthProvider>
  <NotificationProvider>
    {/* ... rest of existing tree ... */}
  </NotificationProvider>
</AuthProvider>

// Remove <Sonner /> line
// (Keep Toaster for shadcn/ui toast compatibility)
```

- [ ] **Step 2: Remove Sonner dependency**

Remove the `import { Toaster as Sonner }` line from App.tsx and optionally uninstall: `npm uninstall sonner`

### Task 10: Backend — Transaction Notification Badge Updates

**Files:**
- Modify: `src/services/transaction-notification.service.ts`

**After each transaction/dispute notification, also emit `badge:update` to affected users so sidebar refreshes.**

- [ ] **Step 1: Add badge update after each notification method**

```typescript
// In src/services/transaction-notification.service.ts
// Add import:
import { badgeService } from './badge.service';

// Add private helper:
private async emitBadgeUpdate(userId: number): Promise<void> {
  const io = this.getIO();
  if (!io) return;
  try {
    const counts = await badgeService.getCounts(userId, '');
    io.to(`user:${userId}`).emit('badge:update', counts);
  } catch {}
}

// At the end of each public method (notifyOwnerNewRequest, notifyClientApproval, etc.):
// Add:
await this.emitBadgeUpdate(transaction.ownerId);
// or:
await this.emitBadgeUpdate(transaction.clientId);
```

For `notifyTransactionExpired`, emit for both userIds.
For dispute methods, emit for the affected parties.

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Unified socket (1 connection) | Task 4 (socket.ts), Task 6 (useTransactionNotifications) |
| badge:update socket events from backend | Task 3 (notification CRUD), Task 10 (transaction) |
| notification:new socket events | Task 3 (notification-inapp.service + controller) |
| NotificationContext with real-time state | Task 5 |
| Refactor useTransactionNotifications | Task 6 |
| Remove polling in useSidebarBadges | Task 7 (60s fallback vs 10-30s) |
| NotificationsSection real-time | Task 8 |
| Consolidate toasts (remove Sonner) | Task 9 |
| Backward compatible, no schema changes | All tasks |

## Execution Handoff

Once approved, ejecuto usando subagent-driven-development: un agente por tarea, en paralelo donde sea posible (backend tasks 1-3 independientes, frontend tasks 4-9 dependientes en serie).
