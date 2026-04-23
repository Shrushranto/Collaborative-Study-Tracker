import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { listMyGoals, createGoal, deleteGoal } from '../controllers/goalController.js';

const router = Router();

router.get('/me', authMiddleware, listMyGoals);
router.post('/', authMiddleware, createGoal);
router.delete('/:id', authMiddleware, deleteGoal);

export default router;
