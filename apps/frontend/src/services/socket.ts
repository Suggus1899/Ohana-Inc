import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3026';

type EventCallback = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<EventCallback>>();
  private _connected = false;
  private _activeConversationId: number | null = null;
  private _onReconnectCallback: (() => void) | null = null;

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
        // Re-join active conversation on reconnect (ChatContext compat)
        if (this._activeConversationId) {
          this.socket?.emit('join_conversation', this._activeConversationId);
        }
        this._onReconnectCallback?.();
      });

      this.socket.on('disconnect', (reason) => {
        this._connected = false;
      });

      this.socket.on('reconnect_error', (err) => {
        console.error('[Socket] Reconnection error:', err);
      });

      this.socket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
      });

      this.socket.on('error', (err: { message: string }) => {
        console.error('[Socket] Error:', err.message);
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
    this._activeConversationId = null;
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

  // --- ChatContext backward-compat helpers ---

  setActiveConversationId(convId: number | null): void {
    this._activeConversationId = convId;
    if (this.socket?.connected && convId) {
      this.socket.emit('join_conversation', convId);
    }
  }

  setOnReconnectCallback(cb: () => void): void {
    this._onReconnectCallback = cb;
  }
}

export const socketService = new SocketService();

// ─── Backward-compat exports (used by ChatContext) ──────────────────────────

export function connectSocket(): Socket {
  return socketService.connect();
}

export function disconnectSocket(): void {
  socketService.disconnect();
}

export function getSocket(): Socket | null {
  return socketService.rawSocket;
}

export function setActiveConversationId(convId: number | null): void {
  socketService.setActiveConversationId(convId);
}

export function setOnReconnectCallback(cb: () => void): void {
  socketService.setOnReconnectCallback(cb);
}
