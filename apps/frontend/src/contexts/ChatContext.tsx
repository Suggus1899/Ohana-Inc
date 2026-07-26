import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { getSocket, connectSocket, setActiveConversationId, disconnectSocket, setOnReconnectCallback } from '@/services/socket';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatParticipant {
  id: number;
  name: string;
  email?: string;
  profilePhotoUrl?: string;
}

export interface ConversationData {
  id: number;
  rentRequestId: number;
  participant1Id: number;
  participant2Id: number;
  lastMessageAt: string | null;
  isActive: boolean;
  status?: 'accepted' | 'pending' | 'rejected';
  isRequest?: boolean;
  participant1?: ChatParticipant;
  participant2?: ChatParticipant;
  rentRequest?: {
    id: number;
    status: string;
    property?: {
      id: number;
      title: string;
      address?: string;
    };
  };
  unreadCount?: number;
  lastMessage?: MessageData | null;
  clearedForP1At?: string | null;
  clearedForP2At?: string | null;
}

export interface MessageData {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isBlocked: boolean;
  readAt: string | null;
  deletedAt?: string | null;
  createdAt: string;
  sender?: { id: number; name: string; profilePhotoUrl?: string };
  tempId?: number;
  isFailed?: boolean;
}

export interface TypingUser {
  userId: number;
  name: string;
  conversationId?: number;
}

export interface BlockedMessageInfo {
  messageId: number;
  reason: string;
  riskScore: number;
  violations: string[];
}

interface ChatContextType {
  conversations: ConversationData[];
  activeConversation: ConversationData | null;
  messages: MessageData[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  typingUsers: TypingUser[];
  totalUnread: number;
  blockedMessages: BlockedMessageInfo[];
  fetchConversations: () => Promise<void>;
  openConversation: (conv: ConversationData) => Promise<void>;
  closeConversation: () => void;
  sendMessage: (content: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  startDirectConversation: (otherUserId: number) => Promise<ConversationData | null>;
  getOtherParticipant: (conv: ConversationData) => ChatParticipant | undefined;
  clearBlockedMessage: (messageId: number) => void;
  lastMessageReceived: MessageData | null;
  deleteMessage: (messageId: number) => Promise<void>;
  deleteConversation: (conversationId: number) => Promise<void>;
  blockUser: (userId: number) => Promise<void>;
  unblockUser: (userId: number) => Promise<void>;
  acceptChatRequest: (conversationId: number) => Promise<void>;
  rejectChatRequest: (conversationId: number) => Promise<void>;
  pendingRequests: ConversationData[];
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = 'habitas_active_conversation';

// Crear sonido de notificación (usando Web Audio API)
const createNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return null;
    
    const audioContext = new AudioContext();
    
    return () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Sonido suave y corto
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    };
  } catch {
    return null;
  }
};

// Solicitar permiso de notificaciones del navegador
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Mostrar notificación del sistema
const showNotification = (title: string, body: string, icon?: string) => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  
  new Notification(title, {
    body,
    icon: icon || '/logo.png',
    badge: '/logo.png',
    tag: 'habitas-message',
    requireInteraction: false,
  });
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [blockedMessages, setBlockedMessages] = useState<BlockedMessageInfo[]>([]);
  const [lastMessageReceived, setLastMessageReceived] = useState<MessageData | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const typingTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const activeConversationRef = useRef<ConversationData | null>(null);
  const isInitialized = useRef(false);
  const isConvRestored = useRef(false);
  const currentUserIdRef = useRef<number | null>(null);
  const processedMessageIds = useRef<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const playMessageSoundRef = useRef<() => void>(() => {});
  const openConversationRef = useRef<(conv: ConversationData) => Promise<void>>(async () => {});

  // Inicializar AudioContext después de primera interacción del usuario
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Función de sonido mejorada
  const playMessageSound = useCallback(() => {
    initAudioContext();
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContextRef.current.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.15);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.15);
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }, [initAudioContext]);
  
  // Actualizar ref de sonido cuando cambie la función
  useEffect(() => {
    playMessageSoundRef.current = playMessageSound;
  }, [playMessageSound]);

  // Solicitar permiso de notificaciones
  const requestPermission = useCallback(async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission as unknown as NotificationPermission);
    return permission;
  }, []);

  // Calcular total unread
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  
  // Actualizar título de la pestaña con badge de mensajes no leídos
  useEffect(() => {
    const baseTitle = 'Habitas - Residencias';
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [totalUnread]);
  
  // Solicitar permiso y cargar conversaciones al autenticar (necesario para el contador en pestaña)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      requestNotificationPermission();
      // Cargar conversaciones en background para que el título muestre el total no leído
      api.getChatConversations().then(res => {
        if (res.success && res.data) {
          setConversations(res.data.conversations as unknown as ConversationData[]);
        }
      });
    }
  }, [isAuthenticated, user?.id]);

  // Restaurar conversación activa cuando las conversaciones se cargan
  // Usa ref para evitar dependencia circular con openConversation
  useEffect(() => {
    if (!isAuthenticated || isConvRestored.current || conversations.length === 0) return;
    isConvRestored.current = true;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const { id, timestamp } = JSON.parse(stored);
      // Solo restaurar si la sesión es reciente (< 24h)
      if (!id || Date.now() - timestamp > 86_400_000) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const found = conversations.find(c => c.id === id);
      if (found) openConversationRef.current(found);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isAuthenticated, conversations]);

  // Persistir conversación activa
  useEffect(() => {
    if (activeConversation) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: activeConversation.id,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeConversation]);

  // Socket connection y listeners — monta cuando el usuario se autentica
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      disconnectSocket();
      isInitialized.current = false;
      currentUserIdRef.current = null;
      return;
    }

    currentUserIdRef.current = user.id;
    isInitialized.current = true;

    const sk = connectSocket();

    const onMessageReceived = (message: MessageData) => {
      if (processedMessageIds.current.has(message.id)) return;
      processedMessageIds.current.add(message.id);

      setLastMessageReceived(message);

      const isFromOtherUser = message.senderId !== currentUserIdRef.current;
      const isNotInActiveConv = !activeConversationRef.current ||
        activeConversationRef.current.id !== message.conversationId;

      if (isFromOtherUser && !isNotInActiveConv && !document.hidden) {
        sk.emit('mark_read', message.conversationId);
      }
      if (isFromOtherUser && (isNotInActiveConv || document.hidden)) {
        playMessageSoundRef.current();
        const senderName = message.sender?.name || 'Nuevo mensaje';
        const text = message.isBlocked ? '[CONTENIDO BLOQUEADO]' : message.content;
        showNotification(senderName, text.length > 100 ? text.slice(0, 100) + '...' : text);
      }

      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === message.conversationId);
        if (idx === -1) {
          // Conv no existe localmente — recargar desde API
          api.getChatConversations().then(res => {
            if (res.success && res.data)
              setConversations(res.data.conversations as unknown as ConversationData[]);
          });
          return prev;
        }
        const updated = prev.map(c => c.id === message.conversationId
          ? {
              ...c,
              lastMessageAt: message.createdAt,
              lastMessage: message,
              unreadCount: (activeConversationRef.current?.id === c.id || !isFromOtherUser)
                ? 0 : (c.unreadCount || 0) + 1,
            }
          : c
        );
        // Mover al tope si hay mensaje nuevo de otro usuario
        if (isFromOtherUser && idx > 0) {
          const conv = updated.splice(idx, 1)[0];
          return [conv, ...updated];
        }
        return updated;
      });

      const activeId = activeConversationRef.current?.id;
      if (activeId && message.conversationId === activeId) {
        setMessages(prev => {
          if (message.tempId) {
            const idx = prev.findIndex(m => m.id === message.tempId);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = { ...message, tempId: undefined };
              return next;
            }
          }
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    const onUserTyping = ({ userId, name, isTyping, conversationId: typingConvId }: { userId: number; name: string; isTyping: boolean; conversationId?: number }) => {
      if (userId === currentUserIdRef.current) return;
      if (typingTimers.current[userId]) clearTimeout(typingTimers.current[userId]);
      if (!isTyping) {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        return;
      }
      setTypingUsers(prev => prev.some(u => u.userId === userId) ? prev : [...prev, { userId, name, conversationId: typingConvId }]);
      typingTimers.current[userId] = setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      }, 4000);
    };

    const onMessagesRead = ({ conversationId }: { conversationId: number }) => {
      if (activeConversationRef.current?.id === conversationId) {
        setMessages(prev => prev.map(m =>
          m.senderId === currentUserIdRef.current && !m.readAt
            ? { ...m, readAt: new Date().toISOString() } : m
        ));
      }
    };

    const onMessageDeletedForMe = ({ messageId }: { messageId: number }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const onContentBlocked = (data: BlockedMessageInfo) => {
      setBlockedMessages(prev => prev.some(bm => bm.messageId === data.messageId) ? prev : [...prev, data]);
    };

    const onNewChatRequest = ({ conversation }: { conversation: ConversationData }) => {
      setConversations(prev => {
        if (prev.some(c => c.id === conversation.id)) {
          // Ya existe (ej. fue rechazada) — actualizar a solicitud nueva
          return prev.map(c => c.id === conversation.id ? { ...conversation, isRequest: true } : c);
        }
        return [{ ...conversation, isRequest: true }, ...prev];
      });
      playMessageSoundRef.current();
      showNotification('Nueva solicitud de chat', `${conversation.participant1?.name || 'Alguien'} quiere enviarte un mensaje`);
    };

    const onChatRequestAccepted = ({ conversationId }: { conversationId: number }) => {
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, status: 'accepted' as const, isRequest: false } : c));
    };

    const onConversationRestored = ({ conversation }: { conversation: ConversationData }) => {
      setConversations(prev => {
        if (prev.some(c => c.id === conversation.id))
          return prev.map(c => c.id === conversation.id ? { ...c, ...conversation } : c);
        return [conversation, ...prev];
      });
    };

    // Registrar todos los listeners
    sk.on('message_received', onMessageReceived);
    sk.on('user_typing', onUserTyping);
    sk.on('messages_read', onMessagesRead);
    sk.on('message_deleted_for_me', onMessageDeletedForMe);
    sk.on('content_blocked', onContentBlocked);
    sk.on('new_chat_request', onNewChatRequest);
    sk.on('chat_request_accepted', onChatRequestAccepted);
    sk.on('conversation_restored', onConversationRestored);

    // Cleanup: desregistrar los listeners exactos al desmontar o cambiar usuario
    return () => {
      sk.off('message_received', onMessageReceived);
      sk.off('user_typing', onUserTyping);
      sk.off('messages_read', onMessagesRead);
      sk.off('message_deleted_for_me', onMessageDeletedForMe);
      sk.off('content_blocked', onContentBlocked);
      sk.off('new_chat_request', onNewChatRequest);
      sk.off('chat_request_accepted', onChatRequestAccepted);
      sk.off('conversation_restored', onConversationRestored);
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    const res = await api.getChatConversations();
    if (res.success && res.data) {
      setConversations(res.data.conversations as unknown as ConversationData[]);
    }
    setIsLoading(false);
  }, []);

  const openConversation = useCallback(async (conv: ConversationData) => {
    const isSameConv = activeConversationRef.current?.id === conv.id;

    // Si ya es la misma conversación activa, no hacer nada — los mensajes están actualizados por socket
    if (isSameConv) return;

    activeConversationRef.current = conv;
    setActiveConversation(conv);
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
    );
    setActiveConversationId(conv.id);

    setIsLoadingMessages(true);
    setMessages([]);
    setTypingUsers([]);
    processedMessageIds.current.clear();

    const res = await api.getChatMessages(conv.id);
    if (res.success && res.data) {
      const apiMsgs = res.data.messages as unknown as MessageData[];
      apiMsgs.forEach(m => processedMessageIds.current.add(m.id));
      // Mergear con mensajes que llegaron por socket mientras cargaba
      setMessages(prev => {
        const apiIds = new Set(apiMsgs.map(m => m.id));
        const socketOnly = prev.filter(m => !apiIds.has(m.id));
        return [...apiMsgs, ...socketOnly];
      });
    }
    setIsLoadingMessages(false);
  }, []);

  // Mantener la ref de openConversation siempre actualizada (para restauración sin loops)
  useEffect(() => {
    openConversationRef.current = openConversation;
  }, [openConversation]);

  const closeConversation = useCallback(() => {
    const socket = getSocket();
    if (socket && activeConversationRef.current) {
      socket.emit('leave_conversation', activeConversationRef.current.id);
    }
    activeConversationRef.current = null;
    setActiveConversation(null);
    setMessages([]);
    setTypingUsers([]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const conv = activeConversationRef.current;
    if (!conv || !content.trim() || !currentUserIdRef.current) return;

    const tempId = Date.now();
    const tempMessage: MessageData = {
      id: tempId,
      conversationId: conv.id,
      senderId: currentUserIdRef.current,
      content: content.trim(),
      isBlocked: false,
      readAt: null,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserIdRef.current, name: user?.name || 'Tú', profilePhotoUrl: user?.profilePhotoUrl },
      tempId,
    };

    // Optimistic: mostrar inmediatamente
    setMessages(prev => [...prev, tempMessage]);

    let socket = getSocket();
    if (!socket) socket = connectSocket();

    if (!socket.connected) {
      await new Promise<void>(resolve => {
        const timeout = setTimeout(resolve, 5000);
        socket!.once('connect', () => { clearTimeout(timeout); resolve(); });
      });
    }

    if (!socket.connected) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, isFailed: true } : m));
      return;
    }

    // Asegurar que estamos en la room antes de enviar
    socket.emit('join_conversation', conv.id);

    // Emitir con callback — el server confirma recepción o error
    socket.emit('send_message', {
      conversationId: conv.id,
      content: content.trim(),
      tempId,
    }, (ack: { error?: string } | undefined) => {
      if (ack?.error) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, isFailed: true } : m));
      }
      // Si no hay error, el server emitirá message_received con tempId
      // y onMessageReceived reemplazará el mensaje temporal por el real.
    });

    // Timeout de seguridad: si el server no confirma en 10s, marcar como fallido.
    // onMessageReceived reemplaza el mensaje temporal antes de que esto dispare.
    setTimeout(() => {
      setMessages(prev => {
        const stillPending = prev.find(m => m.id === tempId && m.tempId === tempId);
        if (stillPending && !stillPending.isFailed) {
          return prev.map(m => m.id === tempId ? { ...m, isFailed: true } : m);
        }
        return prev;
      });
    }, 10000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    const conv = activeConversationRef.current;
    if (!conv) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('user_typing', { conversationId: conv.id, isTyping });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const startDirectConversation = useCallback(async (otherUserId: number): Promise<ConversationData | null> => {
    // Buscar si ya existe una conversación con este usuario en el estado local
    const existing = conversationsRef.current.find(c =>
      c.participant1Id === otherUserId || c.participant2Id === otherUserId
    );
    if (existing) {
      await openConversation(existing);
      return existing;
    }

    try {
      const response = await api.createDirectChatConversation(otherUserId);
      if (response.success && response.data) {
        const conv = response.data.conversation as unknown as ConversationData;
        setConversations(prev => {
          if (prev.some(c => c.id === conv.id)) {
            return prev.map(c => c.id === conv.id ? { ...c, ...conv } : c);
          }
          return [conv, ...prev];
        });
        await openConversation(conv);
        return conv;
      }
    } catch (error) {
      console.error('Error starting direct conversation:', error);
    }
    return null;
  }, [openConversation]);

  const getOtherParticipant = useCallback((conv: ConversationData) => {
    if (!user) return undefined;
    return conv.participant1Id === user.id ? conv.participant2 : conv.participant1;
  }, [user]);

  const clearBlockedMessage = useCallback((messageId: number) => {
    setBlockedMessages(prev => prev.filter(bm => bm.messageId !== messageId));
  }, []);

  const deleteMessageFn = useCallback(async (messageId: number) => {
    const MAX_PG_INT = 2_147_483_647;
    if (messageId > MAX_PG_INT) return;

    // Optimistic: quitar del state inmediatamente
    setMessages(prev => prev.filter(m => m.id !== messageId));

    const socket = getSocket();
    if (socket?.connected) {
      // Vía socket: persiste en chat_message_deletions y emite message_deleted_for_me
      socket.emit('delete_message', { messageId }, (res?: { success: boolean; error?: string }) => {
        if (res && !res.success) {
          // Rollback: el mensaje vuelve a aparecer (se recargará en la próxima apertura)
          console.warn('[Chat] delete_message fallback to API:', res.error);
          api.deleteMessage(messageId).catch(() => {});
        }
      });
    } else {
      // Fallback HTTP si no hay socket
      await api.deleteMessage(messageId).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteConversationFn = useCallback(async (conversationId: number) => {
    await api.deleteConversationForMe(conversationId);
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (activeConversationRef.current?.id === conversationId) {
      activeConversationRef.current = null;
      setActiveConversation(null);
      setMessages([]);
    }
  }, []);

  const blockUserFn = useCallback(async (userId: number) => {
    await api.blockUser(userId);
    setConversations(prev =>
      prev.filter(c => c.participant1Id !== userId && c.participant2Id !== userId)
    );
    if (
      activeConversationRef.current &&
      (activeConversationRef.current.participant1Id === userId ||
        activeConversationRef.current.participant2Id === userId)
    ) {
      activeConversationRef.current = null;
      setActiveConversation(null);
      setMessages([]);
    }
  }, []);

  const unblockUserFn = useCallback(async (userId: number) => {
    await api.unblockUser(userId);
  }, []);

  const acceptChatRequestFn = useCallback(async (conversationId: number) => {
    await api.acceptChatRequest(conversationId);
    const update = (c: ConversationData) =>
      c.id === conversationId ? { ...c, status: 'accepted' as const, isRequest: false } : c;
    setConversations(prev => prev.map(update));
    // Actualizar activeConversation si es la misma para habilitar el input inmediatamente
    if (activeConversationRef.current?.id === conversationId) {
      const updated = update(activeConversationRef.current);
      activeConversationRef.current = updated;
      setActiveConversation(updated);
    }
  }, []);

  const rejectChatRequestFn = useCallback(async (conversationId: number) => {
    await api.rejectChatRequest(conversationId);
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (activeConversationRef.current?.id === conversationId) {
      activeConversationRef.current = null;
      setActiveConversation(null);
      setMessages([]);
    }
    // Salir de la room para no recibir mensajes futuros por esa vía
    const socket = getSocket();
    if (socket?.connected) socket.emit('leave_conversation', conversationId);
  }, []);

  const pendingRequests = conversations.filter(c => c.isRequest === true);

  const value: ChatContextType = {
    conversations,
    activeConversation,
    messages,
    isLoading,
    isLoadingMessages,
    typingUsers,
    totalUnread,
    blockedMessages,
    fetchConversations,
    openConversation,
    closeConversation,
    sendMessage,
    sendTyping,
    startDirectConversation,
    getOtherParticipant,
    clearBlockedMessage,
    lastMessageReceived,
    deleteMessage: deleteMessageFn,
    deleteConversation: deleteConversationFn,
    blockUser: blockUserFn,
    unblockUser: unblockUserFn,
    acceptChatRequest: acceptChatRequestFn,
    rejectChatRequest: rejectChatRequestFn,
    pendingRequests,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
