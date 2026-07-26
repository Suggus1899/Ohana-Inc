import { useCallback } from 'react';
import { useChatContext } from '@/contexts';

export interface UnreadBadges {
  messages: number;
}

export interface UnreadBadgesResult extends UnreadBadges {
  refresh: () => void;
  markConversationRead: (conversationId: number, unreadCount: number) => void;
}

export function useUnreadBadges(): UnreadBadgesResult {
  const { totalUnread, fetchConversations } = useChatContext();

  const refresh = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  const markConversationRead = useCallback((_conversationId: number, _unreadCount: number) => {
    // El ChatContext ya maneja esto via socket — no hacer nada extra
  }, []);

  return { messages: totalUnread, refresh, markConversationRead };
}
