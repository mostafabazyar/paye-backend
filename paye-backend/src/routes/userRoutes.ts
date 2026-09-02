import express from 'express';
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateUserPhotos,
  searchUsers,
} from '../controllers/userController';
import authMiddleware from '../middleware/auth.middleware';

const router = express.Router();

router.use(authMiddleware);

// Get all users for discovery
router.get('/', getAllUsers);

// Search users
router.get('/search', searchUsers);

// Get current user profile
router.get('/me', getCurrentUser);

// Get specific user by ID
router.get('/:id', getUserById);

// Update current user's photos
router.patch('/photos', updateUserPhotos);

export default router;
