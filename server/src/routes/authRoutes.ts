import { Router } from 'express';
import { getAdmins, login, me, register } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/security';

const router = Router();

router.post('/login', authRateLimiter, login);
router.post('/register', authRateLimiter, register);
router.get('/me', authenticate, me);
router.get('/admins', authenticate, getAdmins);

export default router;
