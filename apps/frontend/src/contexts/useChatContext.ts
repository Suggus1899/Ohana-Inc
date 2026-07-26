import { useContext } from 'react';
import { ChatContext } from './ChatContext';

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext debe usarse dentro de ChatProvider');
  }
  return context;
}
