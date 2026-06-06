const express = require('express');
const {
  createProfile,
  getUserProfiles,
  updateProfile,
  deleteProfile,
  getAllProfiles
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createProfile);
router.get('/my-profiles', getUserProfiles);
router.get('/explore', getAllProfiles);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);

module.exports = router;