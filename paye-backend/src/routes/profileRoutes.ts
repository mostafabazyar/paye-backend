// src/routes/profile.routes.ts
import { Router } from 'express';
import { setupProfile, getProfile, createProfileListing, exploreListings, myCreatedProfileListing, editCreatedProfileListing } from '../controllers/profile.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.post('/setup', authMiddleware, setupProfile);
router.post('/create', authMiddleware, createProfileListing);
router.get('/my-listings', authMiddleware, myCreatedProfileListing);
router.patch('/my-listings/:id', authMiddleware, editCreatedProfileListing);
router.get('/explore', authMiddleware, exploreListings);
router.get('/me', authMiddleware, getProfile);

export default router;
// Create a profile/listing
// Explore listings (optional sport filter)