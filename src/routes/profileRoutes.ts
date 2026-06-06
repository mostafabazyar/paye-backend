import express, { Request, Response } from 'express';
import {
  createProfile,
  getUserProfiles,
  updateProfile,
  deleteProfile,
  getAllProfiles
} from '../controllers/profileController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createProfile);
router.get('/my-profiles', getUserProfiles);
router.get('/explore', getAllProfiles);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);

export default router;
