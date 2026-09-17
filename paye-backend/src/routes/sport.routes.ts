import { Router } from 'express';
import { listSports } from '../controllers/sport.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listSports);

export default router;