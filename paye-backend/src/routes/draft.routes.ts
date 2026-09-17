import { Router } from 'express';
import {
  saveDraftStep,
  abandonDraft,
  getMyDraft,
} from '../controllers/draft.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/step', saveDraftStep);
router.post('/abandon', abandonDraft);
router.get('/me', getMyDraft);

export default router;