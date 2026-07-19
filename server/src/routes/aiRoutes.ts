import { Router } from 'express';
import { analyzeRequest } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/analyze-request', authenticate, analyzeRequest);

export default router;
