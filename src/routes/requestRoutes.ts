import express from 'express';
import {
  sendRequest,
  getProfileRequests,
  updateRequestStatus,
  getUserReceivedRequests
} from '../controllers/requestController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.use(authMiddleware);

router.post('/', sendRequest);
router.get('/received', getUserReceivedRequests);
router.get('/profile/:profileId', getProfileRequests);
router.put('/:id', updateRequestStatus);

export default router;
