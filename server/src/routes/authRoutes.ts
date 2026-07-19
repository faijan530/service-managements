import { Router } from 'express';
import { getAdmins, login, me, register, getAllUsers, updateUserStatus } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/security';

const router = Router();

router.post('/login', authRateLimiter, login);
router.post('/register', authRateLimiter, register);
router.get('/me', authenticate, me);
router.get('/admins', authenticate, getAdmins);
router.get('/users', authenticate, getAllUsers);
router.patch('/users/:id/status', authenticate, updateUserStatus);

export default router;
