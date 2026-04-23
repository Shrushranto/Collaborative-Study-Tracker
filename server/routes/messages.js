import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  listConversations,
  getThread,
  sendMessage,
  unreadCount,
} from '../controllers/messageController.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listConversations);
router.get('/unread-count', unreadCount);
router.get('/:userId', getThread);
router.post('/:userId', sendMessage);

export default router;
