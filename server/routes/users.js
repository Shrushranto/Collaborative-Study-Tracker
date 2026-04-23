import { Router } from 'express';
import {
  leaderboard,
  userProfile,
  discoverUsers,
  followUser,
  unfollowUser,
  getFollowList,
} from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
import optionalAuth from '../middleware/optionalAuth.js';

const router = Router();

router.get('/leaderboard', leaderboard);
router.get('/discover', authMiddleware, discoverUsers);
router.get('/:id/profile', optionalAuth, userProfile);
router.get('/:id/followers', optionalAuth, (req, res, next) => { req.params.which = 'followers'; getFollowList(req, res, next); });
router.get('/:id/following', optionalAuth, (req, res, next) => { req.params.which = 'following'; getFollowList(req, res, next); });
router.post('/:id/follow', authMiddleware, followUser);
router.delete('/:id/follow', authMiddleware, unfollowUser);

export default router;
