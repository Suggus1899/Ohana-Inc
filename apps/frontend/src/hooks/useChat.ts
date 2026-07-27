import { useState, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { getSocket } from '@/services/socket';
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
}

export interface MessageData {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isBlocked: boolean;
  readAt: string | null;
  createdAt: string;
  sender?: { id: number; name: string; profilePhotoUrl?: string };
  tempId?: number; // ID temporal para identificar mensajes pendientes
  isFailed?: boolean; // Indica si el envío falló
}

// Alias for backward compatibility
export type ChatMessageData = MessageData;

export interface TypingUser {
  userId: number;
  name: string;
}

export interface BlockedMessageInfo {
  messageId: number;
  reason: string;
  riskScore: number;
  violations: string[];
}

interface UseChatReturn {
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
  startConversation: (rentRequestId: number) => Promise<ConversationData | null>;
  startDirectConversation: (otherUserId: number) => Promise<ConversationData | null>;
  getOtherParticipant: (conv: ConversationData) => ChatParticipant | undefined;
  clearBlockedMessage: (messageId: number) => void;
}

export function useChat(): UseChatReturn {
  const { user, isAuthenticated: _isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationData | null>(null);
  // Keep a ref in sync so socket callbacks can access it without re-subscribing
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [blockedMessages, setBlockedMessages] = useState<BlockedMessageInfo[]>([]);
  const _typingTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const activeConversationRef = useRef<ConversationData | null>(null);

  // Socket listeners are managed centrally by ChatContext — no local socket handling here

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    const res = await api.getChatConversations();
    if (res.success && res.data) {
      setConversations(res.data.conversations as unknown as ConversationData[]);
    }
    setIsLoading(false);
  }, []);

  const openConversation = useCallback(async (conv: ConversationData) => {
    activeConversationRef.current = conv;
    setActiveConversation(conv);
    setIsLoadingMessages(true);
    setTypingUsers([]);

    const socket = getSocket();
    if (socket) {
      socket.emit('join_conversation', { conversationId: conv.id });
      socket.emit('mark_read', { conversationId: conv.id });
    }

    const res = await api.getChatMessages(conv.id);
    if (res.success && res.data) {
      setMessages(res.data.messages as unknown as MessageData[]);
    }
    setIsLoadingMessages(false);

    setConversations(prev =>
      prev.map(c => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const closeConversation = useCallback(() => {
    activeConversationRef.current = null;
    setActiveConversation(null);
    setMessages([]);
    setTypingUsers([]);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeConversation || !content.trim() || !user) return;
      
      // Crear mensaje temporal optimista para mostrar inmediatamente
      const tempMessage: MessageData = {
        id: Date.now(), // ID temporal
        conversationId: activeConversation.id,
        senderId: user.id,
        content: content.trim(),
        isBlocked: false,
        readAt: null,
        createdAt: new Date().toISOString(),
        sender: { id: user.id, name: user.name || 'Tú', profilePhotoUrl: user.profilePhotoUrl },
      };
      
      // Agregar mensaje localmente inmediatamente
      setMessages(prev => [...prev, tempMessage]);
      
      const socket = getSocket();
      if (socket) {
        socket.emit('send_message', {
          conversationId: activeConversation.id,
          content: content.trim(),
        });
      }
    },
    [activeConversation, user]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversation) return;
      const socket = getSocket();
      if (socket) {
        socket.emit('user_typing', {
          conversationId: activeConversation.id,
          isTyping,
        });
      }
    },
    [activeConversation]
  );

  // Create or get conversation by rentRequestId
  const startConversation = useCallback(async (rentRequestId: number): Promise<ConversationData | null> => {
    try {
      const response = await api.createChatConversation(rentRequestId);
      if (response.success && response.data) {
        const conv = response.data.conversation as unknown as ConversationData;
        setConversations(prev => {
          if (prev.some(c => c.id === conv.id)) return prev;
          return [conv, ...prev];
        });
        await openConversation(conv);
        return conv;
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
    return null;
  }, [openConversation]);

  // Create direct conversation with another user
  const startDirectConversation = useCallback(async (otherUserId: number): Promise<ConversationData | null> => {
    try {
      const response = await api.createDirectChatConversation(otherUserId);
      if (response.success && response.data) {
        const conv = response.data.conversation as unknown as ConversationData;
        setConversations(prev => {
          if (prev.some(c => c.id === conv.id)) return prev;
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

  const getOtherParticipant = useCallback(
    (conv: ConversationData): ChatParticipant | undefined => {
      if (!user) return undefined;
      return conv.participant1Id === user.id ? conv.participant2 : conv.participant1;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const clearBlockedMessage = useCallback((messageId: number) => {
    setBlockedMessages(prev => prev.filter(bm => bm.messageId !== messageId));
  }, []);

  return {
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
    startConversation,
    startDirectConversation,
    getOtherParticipant,
    clearBlockedMessage,
  };
}
