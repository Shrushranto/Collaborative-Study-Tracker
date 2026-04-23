import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { chat } from '../controllers/aiController.js';

const router = Router();

router.post('/chat', authMiddleware, chat);

export default router;
