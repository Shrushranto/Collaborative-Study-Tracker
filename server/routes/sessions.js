import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { createSession, mySessions, calendarSummary, sessionsByDate } from '../controllers/sessionController.js';

const router = Router();

router.post('/', authMiddleware, createSession);
router.get('/me', authMiddleware, mySessions);
router.get('/calendar', authMiddleware, calendarSummary);
router.get('/by-date', authMiddleware, sessionsByDate);

export default router;
