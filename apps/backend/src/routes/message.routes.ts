import { Router } from 'express';
import { sendMessage, getConversations, getMessagesWithUser } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/chat/:otherUserId', getMessagesWithUser);

export default router;
