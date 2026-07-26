# Unified Notification System — Design Spec

## Problem

El sistema actual tiene 3 problemas de eficiencia y estabilidad:

1. **2 conexiones Socket.IO separadas** — el singleton de chat y el hook de transacciones abren sockets independientes, duplicando handshake JWT y consumo de recursos
2. **Polling HTTP para badges** — `useSidebarBadges` hace GET cada 10-30s aunque no haya cambios, saturando el servidor a medida crecen los usuarios
3. **Notificaciones in-app sin push** — la tabla `notifications` se escribe pero el frontend solo se entera cuando el usuario navega a la sección manualmente

## Solution: Unified Socket Architecture

Un solo socket por cliente que maneja TODOS los tipos de eventos, eliminando polling y conexiones duplicadas.

```
┌─────────────────────────────────────────────────────┐
│                  UNIFIED SOCKET                       │
│                                                       │
│  chat:*      → ChatContext (mensajes, typing, etc.)   │
│  transaction:* → TransactionPanel (estados, disputas) │
│  notification:* → NotificationContext (nuevas in-app) │
│  badge:*       → Sidebar badges (contadores vivos)    │
└─────────────────────────────────────────────────────┘
```

## Backend Changes

### 1. `src/websocket/socket.ts` — Nuevos tipos de eventos

Agregar al Socket.IO server:
- `notification:new` — payload: `{ notification: Notification }`
- `badge:update` — payload: `{ unreadCount: number, badges: Record<string, number> }`
- Mantener eventos existentes (`chat:*`, `transaction:*`, `dispute:*`)
- Room `user_{userId}` ya existe, no requiere cambios de infraestructura

### 2. `src/services/notification-inapp.service.ts` — Emitir eventos

Después de cada `create()` y `createForMany()`:
- Emitir `notification:new` al room del usuario
- Emitir `badge:update` al room del usuario con el nuevo `unreadCount`

### 3. `src/services/transaction-notification.service.ts` — Badge updates

Agregar emisión de `badge:update` junto con los eventos de transacción existentes para mantener contadores sincronizados.

### 4. Nuevo: `src/services/badge.service.ts` — Cálculo centralizado de badges

Servicio que calcula todos los contadores de un usuario según su rol:

```
Admin:   { pendingKYC, pendingReports, announcementsDraft }
Operator: { pendingVerifications, pendingReviews, pendingSupport, pendingReports, pendingTasks, unreadMessages }
Owner:   { unreadMessages, pendingRequests }
Client:  { unreadMessages, activeRequests }
```

Reutilizable desde:
- Socket.IO (emisión en eventos)
- REST endpoint (carga inicial)
- Jobs (si necesario)

## Frontend Changes

### 1. `src/services/socket.ts` — Singleton unificado

Evolucionar el singleton actual para que maneje todos los eventos, no solo chat:
- Mantener auth JWT, reconexión, transportes
- Agregar registro de callbacks por namespace de eventos
- Exponer `onEvent(namespace, callback)` y `offEvent(namespace, callback)`
- Mantener compatibilidad con ChatContext existente

### 2. Nuevo: `src/contexts/NotificationContext.tsx`

Contexto que:
- Se suscribe a `notification:*` y `badge:*` en el socket unificado
- Mantiene estado: `notifications[]`, `unreadCount`, `badges`
- Expone: `markAsRead(id)`, `markAllAsRead()`, `deleteNotification(id)`
- Carga inicial via REST API (`GET /api/notifications`)
- Actualiza en tiempo real via socket
- Fallback: si socket desconectado, polling cada 60s

### 3. `src/hooks/useTransactionNotifications.ts` — Refactor

- Eliminar creación de socket propio
- Usar el socket singleton del paso 1
- Misma funcionalidad, una conexión menos

### 4. `src/hooks/useSidebarBadges.ts` — Eliminar polling

- Escuchar `badge:update` del socket
- Polling como fallback solo si socket disconnected (cada 60s en vez de 10s)
- Eliminar valores harcodeados (+3 notificaciones mock)

### 5. `src/components/notifications/NotificationsSection.tsx` — Tiempo real

- Suscribirse a `notification:new` via NotificationContext
- Prepend nuevas notificaciones al inicio de la lista
- Actualizar contadores en tiempo real
- Mantener paginación para historial

### 6. Consolidar toasts

- Eliminar `Sonner` (dependencia duplicada)
- Mantener `ToastNotificationContext` (ya tiene sonidos Web Audio + animaciones Framer Motion + 4 tipos)
- Migrar usos de `use-toast` a `useToastNotification` donde sea trivial

## Lo que NO cambia

- Emails (Resend + Nodemailer) — sin cambios
- Jobs programados (cron) — sin cambios
- REST API de notificaciones — se mantiene para carga inicial e historial
- Tabla `notifications` en DB — sin cambios de schema
- Chat system — el socket es el mismo, solo se unifica la conexión

## Escalabilidad

| Métrica | Antes | Después |
|---|---|---|
| Conexiones por usuario | 2 WebSocket | 1 WebSocket |
| Requests polling/día (1000 users) | ~86,400 GET /unread-count | 0 (push) |
| Requests polling/día (10,000 users) | ~864,000 GET /unread-count | 0 (push) |
| Latencia badges | 10-30s (polling interval) | <100ms (push) |
| Latencia notificaciones | manual (cuando usuario navega) | <100ms (push) |

## Testing

- Backend: testear que `notification:new` y `badge:update` se emiten correctamente
- Frontend: testear que NotificationContext recibe y procesa eventos
- Fallback: testear comportamiento con socket desconectado

## Migration

1. Backend primero: badge.service.ts + socket.ts + notification-inapp.service.ts
2. Frontend después: socket singleton → NotificationContext → hooks → componentes
3. Deployment: los cambios son compatibles hacia atrás (el socket nuevo maneja eventos viejos)
