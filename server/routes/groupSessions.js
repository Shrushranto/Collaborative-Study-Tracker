import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  createGroupSession,
  listMyGroupSessions,
  getGroupSession,
  joinGroupSession,
  leaveGroupSession,
  startGroupSession,
  endGroupSession,
  inviteByName,
  tick,
} from '../controllers/groupSessionController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listMyGroupSessions);
router.post('/', createGroupSession);
router.post('/join', joinGroupSession);
router.get('/:id', getGroupSession);
router.delete('/:id/leave', leaveGroupSession);
router.post('/:id/start', startGroupSession);
router.post('/:id/end', endGroupSession);
router.post('/:id/invite', inviteByName);
router.post('/:id/tick', tick);

export default router;
