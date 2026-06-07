// src/routes/profile.routes.ts
import { Router } from 'express';
import { setupProfile, getProfile, createProfileListing, exploreListings } from '../controllers/profile.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.post('/setup', authMiddleware, setupProfile);
router.post('/create', authMiddleware, createProfileListing);
router.get('/explore', authMiddleware, exploreListings);
router.get('/me', authMiddleware, getProfile);

export default router;
// Create a profile/listing
// Explore listings (optional sport filter)