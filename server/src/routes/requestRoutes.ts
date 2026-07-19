import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  assignRequest,
  cancelRequest,
} from '../controllers/requestController';

const router = Router();

router.post('/', authenticate, createRequest);
router.get('/', authenticate, getRequests);
router.get('/:id', authenticate, getRequestById);
router.patch('/:id/status', authenticate, updateRequestStatus);
router.put('/:id/assign', authenticate, assignRequest);
router.post('/:id/cancel', authenticate, cancelRequest);

export default router;
