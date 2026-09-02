import express from 'express';
import {
  sendRequest,
  getProfileRequests,
  updateRequestStatus,
  getUserReceivedRequests,
  getUserSentRequests,
  getRequestById
} from '../controllers/requestController';
import authMiddleware from '../middleware/auth.middleware';

const router = express.Router();

router.use(authMiddleware);

router.post('/', sendRequest);
router.get('/received', getUserReceivedRequests);
router.get('/sent', getUserSentRequests);
router.get('/:id', getRequestById);
router.get('/profile/:profileId', getProfileRequests);
router.put('/:id', updateRequestStatus);

export default router;
