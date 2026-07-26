import { Router } from 'express';
import {
  getConversations,
  getMessages,
  createOrGetConversation,
  getUnreadCount,
  createDirectConversation,
  searchUsersForChat,
  acceptChatRequest,
  rejectChatRequest,
  blockUser,
  unblockUser,
  getBlockedUsers,
  deleteMessage,
  deleteConversationForMe,
  getAvailableOperators,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Conversaciones
router.get('/conversations', getConversations);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations', createOrGetConversation);
router.post('/conversations/direct', createDirectConversation);
router.delete('/conversations/:id', deleteConversationForMe);

// Solicitudes de chat
router.post('/conversations/:id/accept', acceptChatRequest);
router.post('/conversations/:id/reject', rejectChatRequest);

// Bloqueos
router.get('/blocks', getBlockedUsers);
router.post('/blocks', blockUser);
router.delete('/blocks', unblockUser);

// Mensajes
router.delete('/messages/:id', deleteMessage);

// Utiles
router.get('/unread-count', getUnreadCount);
router.get('/search-users', searchUsersForChat);
router.get('/available-operators', getAvailableOperators);

export default router;
