import { Router } from 'express';
import {
  saveDraftStep,
  abandonDraft,
  getMyDraft,
  completeDraft,
} from '../controllers/draft.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/step', saveDraftStep);
router.post('/abandon', abandonDraft);
router.get('/me', getMyDraft);
router.post('/complete', completeDraft);

export default router;