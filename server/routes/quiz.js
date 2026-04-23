import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  getFlashcards,
  getTopics,
  getWeeklyQuiz,
  submitQuiz,
  getQuizLeaderboard,
  seedFlashcards,
} from '../controllers/quizController.js';

const router = Router();

router.get('/flashcards', getFlashcards);
router.get('/topics', getTopics);
router.get('/weekly', authMiddleware, getWeeklyQuiz);
router.post('/submit', authMiddleware, submitQuiz);
router.get('/leaderboard', authMiddleware, getQuizLeaderboard);
router.post('/seed', seedFlashcards);

export default router;
