import { Router } from 'express';
import { signup, login, me, updateProfile, changePassword, deleteAccount, updatePublicKey } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.put('/profile', authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);
router.delete('/account', authMiddleware, deleteAccount);
router.put('/public-key', authMiddleware, updatePublicKey);

export default router;
