// src/routes/profile.routes.ts
import { Router } from 'express';
import { setupProfile, getProfile } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.post('/setup', authMiddleware, setupProfile);
router.get('/me', authMiddleware, getProfile);

export default router;